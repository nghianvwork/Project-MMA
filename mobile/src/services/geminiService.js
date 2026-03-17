/**
 * geminiService.js
 * Gọi Gemini API để:
 * 1. Tra cứu thông tin thuốc VN từ mã barcode (lookupDrugByBarcode)
 * 2. Nhận diện thuốc từ ảnh (identifyDrugFromImage)
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() || '';

// Ưu tiên model mới đang hỗ trợ generateContent.
const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const repairTruncatedJSON = (rawText) => {
    const text = String(rawText || '').trim();

    if (!text) {
        return null;
    }

    const start = text.indexOf('{');
    if (start === -1) {
        return null;
    }

    let candidate = text.slice(start);
    const openBraces = (candidate.match(/\{/g) || []).length;
    const closeBraces = (candidate.match(/\}/g) || []).length;

    if (closeBraces < openBraces) {
        candidate += '}'.repeat(openBraces - closeBraces);
    }

    try {
        return JSON.parse(candidate);
    } catch {
        return null;
    }
};

/**
 * Gọi Gemini với retry exponential backoff khi gặp 429
 * @param {Array} parts
 * @param {number} maxRetries
 */
const callGemini = async (parts, maxRetries = 3) => {
    if (!GEMINI_API_KEY) {
        throw new Error('Chưa cấu hình Gemini API key. Vui lòng thêm EXPO_PUBLIC_GEMINI_API_KEY vào file .env');
    }

    const body = {
        contents: [{ parts }],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 2048,
        },
    };

    let lastError = null;
    let modelNotSupportedCount = 0;

    for (const modelName of GEMINI_MODELS) {
        const url = `${GEMINI_BASE}/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                if (response.status === 404) {
                    const errText = await response.text();
                    console.log(`[gemini] Model ${modelName} không hỗ trợ:`, errText.slice(0, 300));
                    modelNotSupportedCount += 1;
                    break;
                }

                // Rate limit – chờ rồi thử lại
                if (response.status === 429) {
                    const retryAfterHeader = response.headers.get('Retry-After');
                    const waitSeconds = retryAfterHeader
                        ? parseInt(retryAfterHeader, 10)
                        : Math.pow(2, attempt + 1); // 2s, 4s, 8s

                    console.log(`[gemini] 429 rate limit – chờ ${waitSeconds}s (lần ${attempt + 1}/${maxRetries})`);

                    if (attempt < maxRetries - 1) {
                        await sleep(waitSeconds * 1000);
                        continue;
                    }

                    throw new Error(
                        'Gemini API đang bận (429). Bạn có thể:\n' +
                        '• Thử lại sau vài giây\n' +
                        '• Kiểm tra quota tại: https://aistudio.google.com/app/quota',
                    );
                }

                if (!response.ok) {
                    const errText = await response.text();
                    console.log('[gemini] HTTP error:', response.status, errText.slice(0, 300));
                    throw new Error(`Gemini API lỗi ${response.status}`);
                }

                const data = await response.json();

                // Kiểm tra finishReason – nếu bị cắt do MAX_TOKENS
                const candidate = data?.candidates?.[0];
                const finishReason = candidate?.finishReason || '';
                const text = candidate?.content?.parts?.[0]?.text || '';

                if (!text) {
                    throw new Error('Gemini không trả về nội dung');
                }

                // Xóa markdown code fences nếu có
                const clean = text.replace(/```json\s*|```\s*/g, '').trim();

                // Thử parse trực tiếp
                try {
                    return JSON.parse(clean);
                } catch (parseErr) {
                    // JSON bị cắt – thử sửa bằng cách đóng ngoặc
                    console.log('[gemini] JSON bị cắt, đang sửa...', finishReason);
                    const repaired = repairTruncatedJSON(clean);
                    if (repaired) {
                        return repaired;
                    }
                    throw new Error('Gemini trả về JSON không hoàn chỉnh. Vui lòng thử lại.');
                }

            } catch (error) {
                lastError = error;
                if (error.message.includes('429')) {
                    if (attempt >= maxRetries - 1) throw error;
                    continue;
                }
                if (error.message.includes('Gemini')) {
                    throw error;
                }
            }
        }
    }

    if (modelNotSupportedCount === GEMINI_MODELS.length) {
        throw new Error('Không tìm thấy model Gemini phù hợp. Vui lòng kiểm tra phiên bản model trong cấu hình.');
    }

    throw lastError || new Error('Không thể kết nối Gemini API');
};

/**
 * Tra cứu thông tin thuốc VN theo barcode
 * @param {string} barcode
 * @returns {{ name, dosage, form, note, description } | null}
 */
export const lookupDrugByBarcode = async (barcode) => {
    const prompt = `Bạn là chuyên gia dược phẩm Việt Nam.
Mã vạch thuốc: "${barcode}"

Tra cứu thông tin thuốc (ưu tiên thuốc VN / nhập khẩu bán tại VN).
Chỉ trả về JSON, không thêm văn bản nào khác:
{
  "found": true hoặc false,
  "name": "Tên thương mại",
  "dosage": "Hàm lượng, VD: Paracetamol 500mg",
  "form": "Dạng bào chế, VD: Viên nén",
  "note": "Hãng sản xuất và công dụng chính",
  "description": "Mô tả ngắn (2-3 câu)"
}
Nếu không tìm được barcode này, trả về {"found": false}.`;

    let result;
    try {
        result = await callGemini([{ text: prompt }]);
    } catch (error) {
        console.log('[geminiService] lookupDrugByBarcode failed:', error.message);
        throw error;
    }

    if (!result?.found) {
        return null;
    }

    return {
        name: result.name || '',
        dosage: result.dosage || null,
        form: result.form || null,
        note: result.note || null,
        description: result.description || null,
    };
};

/**
 * Nhận diện thuốc từ ảnh
 * @param {string} base64Image - base64 của ảnh (không có tiền tố data:...)
 * @param {string} mimeType - VD: 'image/jpeg'
 * @returns {{ name, dosage, form, note, description, barcode } | null}
 */
export const identifyDrugFromImage = async (base64Image, mimeType = 'image/jpeg') => {
    const prompt = `Bạn là chuyên gia dược phẩm Việt Nam. Phân tích ảnh hộp/vỉ/chai thuốc.

Chỉ trả về JSON, không thêm văn bản nào khác:
{
  "found": true hoặc false,
  "name": "Tên thương mại",
  "dosage": "Hàm lượng, VD: Paracetamol 500mg",
  "form": "Dạng bào chế, VD: Viên nén",
  "note": "Hãng sản xuất và công dụng chính",
  "description": "Công dụng, chỉ định, lưu ý quan trọng (3-5 câu)",
  "barcode": "Mã vạch trong ảnh hoặc null"
}
Nếu ảnh không phải thuốc, trả về {"found": false}.`;

    let result;
    try {
        result = await callGemini([
            { text: prompt },
            {
                inlineData: {
                    mimeType,
                    data: base64Image,
                },
            },
        ]);
    } catch (error) {
        console.log('[geminiService] identifyDrugFromImage failed:', error.message);
        throw error;
    }

    if (!result?.found) {
        return null;
    }

    return {
        name: result.name || '',
        dosage: result.dosage || null,
        form: result.form || null,
        note: result.note || null,
        description: result.description || null,
        barcode: result.barcode || null,
    };
};
