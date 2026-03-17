import { lookupMedicineByBarcodeGemini } from './geminiMedicineLookupService';

const OPEN_FDA_LOOKUP_URL = 'https://api.fda.gov/drug/ndc.json';

const getPackageDescription = (packages = []) => {
    if (!Array.isArray(packages) || packages.length === 0) {
        return '';
    }

    const firstPackage = packages[0] || {};
    return firstPackage.description || firstPackage.package_description || '';
};

const getDosageText = (activeIngredients = []) => {
    if (!Array.isArray(activeIngredients) || activeIngredients.length === 0) {
        return '';
    }

    return activeIngredients
        .map((ingredient) => [ingredient?.name, ingredient?.strength].filter(Boolean).join(' '))
        .filter(Boolean)
        .join(', ');
};

const normalizeBarcode = (barcode) => String(barcode || '').trim().replace(/\s+/g, '');

const buildSearchTerms = (barcode) => {
    const cleaned = normalizeBarcode(barcode);
    const digitsOnly = cleaned.replace(/\D/g, '');
    const candidates = [cleaned, digitsOnly].filter(Boolean);

    return [...new Set(
        candidates.flatMap((candidate) => [
            `package_ndc:"${candidate}"`,
            `product_ndc:"${candidate}"`,
        ]),
    )];
};

const mapOpenFdaMedicine = (record, barcode) => {
    const dosage = getDosageText(record?.active_ingredients);
    const packageDescription = getPackageDescription(record?.packaging);
    const noteParts = [record?.labeler_name, packageDescription].filter(Boolean);

    return {
        barcode,
        name: record?.brand_name || record?.generic_name || '',
        dosage: dosage || null,
        form: record?.dosage_form || null,
        note: noteParts.length > 0 ? noteParts.join(' - ') : null,
    };
};

const lookupByTerm = async (searchTerm) => {
    const response = await fetch(
        `${OPEN_FDA_LOOKUP_URL}?search=${encodeURIComponent(searchTerm)}&limit=1`,
        {
            headers: {
                Accept: 'application/json',
            },
        },
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Lookup failed with status ${response.status}`);
    }

    const payload = await response.json();
    return payload?.results?.[0] || null;
};

export const lookupMedicineByBarcode = async (barcode) => {
    const normalizedBarcode = normalizeBarcode(barcode);

    if (!normalizedBarcode) {
        return {
            matched: false,
            barcode: '',
        };
    }

    let lastError = null;

    for (const term of buildSearchTerms(normalizedBarcode)) {
        try {
            const record = await lookupByTerm(term);

            if (record) {
                return {
                    matched: true,
                    barcode: normalizedBarcode,
                    source: 'openfda',
                    medicine: mapOpenFdaMedicine(record, normalizedBarcode),
                };
            }
        } catch (error) {
            lastError = error;
        }
    }

    if (lastError) {
        console.log('[barcodeLookup] OpenFDA lookup failed:', lastError.message);
    }

    // Fallback: use Gemini AI for Vietnamese and unlisted medicines
    try {
        return await lookupMedicineByBarcodeGemini(normalizedBarcode);
    } catch (geminiError) {
        console.log('[barcodeLookup] Gemini fallback failed:', geminiError.message);
    }

    return {
        matched: false,
        barcode: normalizedBarcode,
    };
};

export const sanitizeBarcode = normalizeBarcode;
