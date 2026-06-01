"use strict";
//functions/secure-patient-operations/src/main.ts
/**
 * Appwrite Function: Secure Patient Operations
 *
 * Handles all CRUD operations on patient data with encryption/decryption
 * Enforces role-based access control and audit logging
 *
 * Setup:
 * 1. Create function in Appwrite Console
 * 2. Set runtime to Node.js 18.x
 * 3. Add environment variable: ENCRYPTION_KEY
 * 4. Deploy this code
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_appwrite_1 = require("node-appwrite");
// Initialize Appwrite client
function initAppwrite(req) {
    const client = new node_appwrite_1.Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1")
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(req.headers["x-appwrite-key"] || process.env.APPWRITE_API_KEY);
    return new node_appwrite_1.Databases(client);
}
// Encryption utilities (simplified version - import from shared module in production)
async function encryptField(plaintext) {
    const crypto = await Promise.resolve().then(() => __importStar(require("crypto")));
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "base64");
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    const tag = cipher.getAuthTag();
    return {
        ciphertext: encrypted,
        iv: iv.toString("base64"),
        tag: tag.toString("base64"),
    };
}
async function decryptField(ciphertext, iv, tag) {
    const crypto = await Promise.resolve().then(() => __importStar(require("crypto")));
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
// Encrypt sensitive patient fields
async function encryptPatientData(data) {
    const sensitiveFields = [
        "first_name",
        "last_name",
        "id_number",
        "passport_number",
        "phone",
        "email",
        "address",
        "emergency_contact_name",
        "emergency_contact_phone",
        "medical_history",
        "current_medications",
        "allergies",
    ];
    const encrypted = { ...data };
    for (const field of sensitiveFields) {
        if (data[field]) {
            const { ciphertext, iv, tag } = await encryptField(String(data[field]));
            encrypted[`${field}_enc`] = ciphertext;
            encrypted[`${field}_iv`] = iv;
            encrypted[`${field}_tag`] = tag;
            delete encrypted[field];
        }
    }
    return encrypted;
}
// Decrypt sensitive patient fields
async function decryptPatientData(data, fieldsToDecrypt) {
    const decrypted = { ...data };
    for (const field of fieldsToDecrypt) {
        const encField = `${field}_enc`;
        const ivField = `${field}_iv`;
        const tagField = `${field}_tag`;
        if (data[encField] && data[ivField] && data[tagField]) {
            try {
                decrypted[field] = await decryptField(data[encField], data[ivField], data[tagField]);
                delete decrypted[encField];
                delete decrypted[ivField];
                delete decrypted[tagField];
            }
            catch (error) {
                console.error(`Failed to decrypt ${field}:`, error);
                decrypted[field] = null;
            }
        }
    }
    return decrypted;
}
// Access control check
function hasPermission(role, action) {
    const permissions = {
        super_admin: ["create", "read", "update", "delete", "list", "findDuplicates"],
        clinic_admin: ["create", "read", "update", "delete", "list", "findDuplicates"],
        receptionist: ["create", "read", "update", "list", "findDuplicates"],
        nurse: ["read", "update", "list", "findDuplicates"],
        doctor: ["read", "update", "list", "findDuplicates"],
        employer: ["read", "list"], // Employers shouldn't search for duplicates
    };
    return permissions[role]?.includes(action) || false;
}
// Get allowed decryption fields for role
function getAllowedFields(role) {
    const fieldAccess = {
        super_admin: ["*"],
        clinic_admin: ["*"],
        receptionist: ["first_name", "last_name", "phone", "email", "address"],
        nurse: [
            "first_name",
            "last_name",
            "id_number",
            "phone",
            "email",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "medical_history",
            "current_medications",
            "allergies",
        ],
        doctor: [
            "first_name",
            "last_name",
            "id_number",
            "phone",
            "email",
            "address",
            "emergency_contact_name",
            "emergency_contact_phone",
            "medical_history",
            "current_medications",
            "allergies",
        ],
        employer: [], // Employers see pre-approved summaries only
    };
    return fieldAccess[role] || [];
}
// Create audit log
async function createAuditLog(databases, entry) {
    try {
        await databases.createDocument(process.env.APPWRITE_DATABASE_ID, "audit_logs", node_appwrite_1.ID.unique(), {
            ...entry,
            timestamp: new Date().toISOString(),
            changes: entry.changes ? JSON.stringify(entry.changes) : null,
            metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        });
    }
    catch (error) {
        console.error("Failed to create audit log:", error);
    }
}
// Helper function to find potential duplicates
function findPotentialDuplicates(patients, criteria) {
    const duplicates = [];
    // Simple duplicate detection logic
    patients.forEach(patient => {
        let matchScore = 0;
        const matchFields = [];
        if (criteria.name && patient.first_name && patient.last_name) {
            const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
            const searchName = criteria.name.toLowerCase();
            if (fullName.includes(searchName) || searchName.includes(patient.first_name.toLowerCase()) || searchName.includes(patient.last_name.toLowerCase())) {
                matchScore++;
                matchFields.push("name");
            }
        }
        if (criteria.idNumber && patient.id_number === criteria.idNumber) {
            matchScore += 2; // Higher weight for exact ID match
            matchFields.push("id_number");
        }
        if (criteria.phone && patient.phone === criteria.phone) {
            matchScore += 2; // Higher weight for exact phone match
            matchFields.push("phone");
        }
        if (criteria.email && patient.email === criteria.email) {
            matchScore += 2; // Higher weight for exact email match
            matchFields.push("email");
        }
        // Also check partial matches
        if (criteria.phone && patient.phone && patient.phone.includes(criteria.phone)) {
            matchScore += 1;
            if (!matchFields.includes("phone"))
                matchFields.push("phone_partial");
        }
        if (criteria.idNumber && patient.id_number && patient.id_number.includes(criteria.idNumber)) {
            matchScore += 1;
            if (!matchFields.includes("id_number"))
                matchFields.push("id_number_partial");
        }
        if (matchScore > 0) {
            duplicates.push({
                id: patient.$id,
                first_name: patient.first_name,
                last_name: patient.last_name,
                id_number: criteria.idNumber ? "***" : patient.id_number, // Mask if searching by ID
                phone: criteria.phone ? "***" : patient.phone, // Mask if searching by phone
                email: criteria.email ? "***" : patient.email, // Mask if searching by email
                date_of_birth: patient.date_of_birth,
                gender: patient.gender,
                matchScore,
                matchFields,
                created_at: patient.created_at,
                // Include non-sensitive fields
                ...(patient.blood_type && { blood_type: patient.blood_type }),
                ...(patient.medical_record_number && { medical_record_number: patient.medical_record_number }),
            });
        }
    });
    return duplicates.sort((a, b) => b.matchScore - a.matchScore);
}
// Main function handler
exports.default = async ({ req, res, log, error }) => {
    try {
        // Parse request payload
        const payload = JSON.parse(req.body || "{}");
        log("Request received:", { action: payload.action, userId: payload.userId, role: payload.userRole });
        // Initialize database
        const databases = initAppwrite(req);
        // Check permissions
        if (!hasPermission(payload.userRole, payload.action)) {
            // Audit failed attempt
            await createAuditLog(databases, {
                clinic_id: payload.clinicId,
                user_id: payload.userId,
                user_email: payload.userEmail,
                user_role: payload.userRole,
                action: payload.action,
                entity_type: "patient",
                entity_id: payload.patientId || "unknown",
                success: false,
                error_message: "Insufficient permissions",
                risk_level: "critical",
            });
            return res.json({ success: false, error: "Insufficient permissions" }, 403);
        }
        let result;
        switch (payload.action) {
            case "create": {
                // Encrypt sensitive fields
                const encryptedData = await encryptPatientData(payload.data);
                encryptedData.clinic_id = payload.clinicId;
                encryptedData.created_at = new Date().toISOString();
                encryptedData.updated_at = new Date().toISOString();
                // Create patient record
                const patient = await databases.createDocument(process.env.APPWRITE_DATABASE_ID, "patients", node_appwrite_1.ID.unique(), encryptedData);
                // Audit the creation
                await createAuditLog(databases, {
                    clinic_id: payload.clinicId,
                    user_id: payload.userId,
                    user_email: payload.userEmail,
                    user_role: payload.userRole,
                    action: "create",
                    entity_type: "patient",
                    entity_id: patient.$id,
                    entity_description: `New patient created`,
                    success: true,
                    risk_level: "low",
                });
                result = { success: true, data: { id: patient.$id } };
                break;
            }
            case "read": {
                if (!payload.patientId) {
                    return res.json({ success: false, error: "Patient ID required" }, 400);
                }
                // Fetch patient record
                const patient = await databases.getDocument(process.env.APPWRITE_DATABASE_ID, "patients", payload.patientId);
                // Check clinic access
                if (patient.clinic_id !== payload.clinicId && payload.userRole !== "super_admin") {
                    await createAuditLog(databases, {
                        clinic_id: payload.clinicId,
                        user_id: payload.userId,
                        user_email: payload.userEmail,
                        user_role: payload.userRole,
                        action: "read",
                        entity_type: "patient",
                        entity_id: payload.patientId,
                        success: false,
                        error_message: "Access denied - different clinic",
                        risk_level: "critical",
                    });
                    return res.json({ success: false, error: "Access denied" }, 403);
                }
                // Decrypt allowed fields
                const allowedFields = getAllowedFields(payload.userRole);
                const fieldsToDecrypt = allowedFields.includes("*")
                    ? [
                        "first_name",
                        "last_name",
                        "id_number",
                        "passport_number",
                        "phone",
                        "email",
                        "address",
                        "emergency_contact_name",
                        "emergency_contact_phone",
                        "medical_history",
                        "current_medications",
                        "allergies",
                    ]
                    : allowedFields;
                const decryptedPatient = await decryptPatientData(patient, fieldsToDecrypt);
                // Audit the read
                await createAuditLog(databases, {
                    clinic_id: payload.clinicId,
                    user_id: payload.userId,
                    user_email: payload.userEmail,
                    user_role: payload.userRole,
                    action: "decrypt",
                    entity_type: "patient",
                    entity_id: payload.patientId,
                    entity_description: `Decrypted fields: ${fieldsToDecrypt.join(", ")}`,
                    metadata: { fields_decrypted: fieldsToDecrypt },
                    success: true,
                    risk_level: "medium",
                });
                result = { success: true, data: decryptedPatient };
                break;
            }
            case "update": {
                if (!payload.patientId) {
                    return res.json({ success: false, error: "Patient ID required" }, 400);
                }
                // Fetch existing patient
                const existingPatient = await databases.getDocument(process.env.APPWRITE_DATABASE_ID, "patients", payload.patientId);
                // Check clinic access
                if (existingPatient.clinic_id !== payload.clinicId && payload.userRole !== "super_admin") {
                    return res.json({ success: false, error: "Access denied" }, 403);
                }
                // Encrypt updated fields
                const encryptedUpdates = await encryptPatientData(payload.data);
                encryptedUpdates.updated_at = new Date().toISOString();
                // Update patient record
                const updatedPatient = await databases.updateDocument(process.env.APPWRITE_DATABASE_ID, "patients", payload.patientId, encryptedUpdates);
                // Track changes for audit
                const changes = {};
                Object.keys(payload.data).forEach((key) => {
                    changes[key] = {
                        old: "***",
                        new: "***", // Don't log actual PHI values
                    };
                });
                // Audit the update
                await createAuditLog(databases, {
                    clinic_id: payload.clinicId,
                    user_id: payload.userId,
                    user_email: payload.userEmail,
                    user_role: payload.userRole,
                    action: "update",
                    entity_type: "patient",
                    entity_id: payload.patientId,
                    entity_description: `Updated ${Object.keys(payload.data).length} fields`,
                    changes,
                    success: true,
                    risk_level: "medium",
                });
                result = { success: true, data: { id: updatedPatient.$id } };
                break;
            }
            case "delete": {
                if (!payload.patientId) {
                    return res.json({ success: false, error: "Patient ID required" }, 400);
                }
                // Fetch patient to verify clinic
                const patientToDelete = await databases.getDocument(process.env.APPWRITE_DATABASE_ID, "patients", payload.patientId);
                // Check clinic access
                if (patientToDelete.clinic_id !== payload.clinicId && payload.userRole !== "super_admin") {
                    return res.json({ success: false, error: "Access denied" }, 403);
                }
                // Delete patient record
                await databases.deleteDocument(process.env.APPWRITE_DATABASE_ID, "patients", payload.patientId);
                // Audit the deletion
                await createAuditLog(databases, {
                    clinic_id: payload.clinicId,
                    user_id: payload.userId,
                    user_email: payload.userEmail,
                    user_role: payload.userRole,
                    action: "delete",
                    entity_type: "patient",
                    entity_id: payload.patientId,
                    entity_description: "Patient record deleted",
                    success: true,
                    risk_level: "high",
                });
                result = { success: true, data: { id: payload.patientId } };
                break;
            }
            case "list": {
                // Build query filters
                const queries = [node_appwrite_1.Query.equal("clinic_id", payload.clinicId), node_appwrite_1.Query.limit(100)];
                if (payload.filters?.employerId) {
                    queries.push(node_appwrite_1.Query.equal("employer_id", payload.filters.employerId));
                }
                // Fetch patients
                const response = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID, "patients", queries);
                // Decrypt allowed fields for each patient
                const allowedFields = getAllowedFields(payload.userRole);
                const fieldsToDecrypt = allowedFields.includes("*")
                    ? ["first_name", "last_name", "phone", "email"]
                    : allowedFields.slice(0, 4); // Limit fields for list view
                const decryptedPatients = await Promise.all(response.documents.map((patient) => decryptPatientData(patient, fieldsToDecrypt)));
                // Audit the list operation
                await createAuditLog(databases, {
                    clinic_id: payload.clinicId,
                    user_id: payload.userId,
                    user_email: payload.userEmail,
                    user_role: payload.userRole,
                    action: "read",
                    entity_type: "patient",
                    entity_id: "list",
                    entity_description: `Listed ${response.documents.length} patients`,
                    metadata: {
                        count: response.documents.length,
                        filters: payload.filters,
                    },
                    success: true,
                    risk_level: "low",
                });
                result = {
                    success: true,
                    data: {
                        documents: decryptedPatients,
                        total: response.total,
                    },
                };
                break;
            }
            case "findDuplicates": {
                // Validate input
                const searchCriteria = payload.data || {};
                if (Object.keys(searchCriteria).length === 0) {
                    return res.json({ success: false, error: "Search criteria required" }, 400);
                }
                // Build query to fetch relevant patients
                // Since sensitive fields are encrypted, we need to fetch all patients and filter after decryption
                // In production, you might want to store hashed versions of sensitive fields for searching
                const queries = [
                    node_appwrite_1.Query.equal("clinic_id", payload.clinicId),
                    node_appwrite_1.Query.limit(200) // Limit for performance
                ];
                // Try to add some basic filters if possible
                if (searchCriteria.medical_record_number) {
                    queries.push(node_appwrite_1.Query.equal("medical_record_number", searchCriteria.medical_record_number));
                }
                if (searchCriteria.date_of_birth) {
                    queries.push(node_appwrite_1.Query.equal("date_of_birth", searchCriteria.date_of_birth));
                }
                if (searchCriteria.gender) {
                    queries.push(node_appwrite_1.Query.equal("gender", searchCriteria.gender));
                }
                // Fetch patients
                const patients = await databases.listDocuments(process.env.APPWRITE_DATABASE_ID, "patients", queries);
                // Decrypt fields needed for duplicate checking
                const allowedFields = getAllowedFields(payload.userRole);
                const fieldsToDecrypt = ["first_name", "last_name", "id_number", "phone", "email"]
                    .filter(field => allowedFields.includes("*") || allowedFields.includes(field));
                const decryptedPatients = await Promise.all(patients.documents.map(patient => decryptPatientData(patient, fieldsToDecrypt)));
                // Find potential duplicates
                const duplicates = findPotentialDuplicates(decryptedPatients, searchCriteria);
                // Audit the duplicate search
                await createAuditLog(databases, {
                    clinic_id: payload.clinicId,
                    user_id: payload.userId,
                    user_email: payload.userEmail,
                    user_role: payload.userRole,
                    action: "read",
                    entity_type: "patient",
                    entity_id: "duplicate_search",
                    entity_description: `Duplicate search with ${Object.keys(searchCriteria).length} criteria`,
                    metadata: {
                        search_criteria: Object.keys(searchCriteria),
                        patients_scanned: patients.documents.length,
                        duplicates_found: duplicates.length,
                        operation: "findDuplicates"
                    },
                    success: true,
                    risk_level: "medium",
                });
                result = { success: true, data: duplicates };
                break;
            }
            default:
                return res.json({ success: false, error: "Invalid action" }, 400);
        }
        return res.json(result);
    }
    catch (err) {
        error("Function error:", err);
        // Try to audit the failure if we have enough context
        try {
            const payload = JSON.parse(req.body || "{}");
            const databases = initAppwrite(req);
            await createAuditLog(databases, {
                clinic_id: payload.clinicId || "unknown",
                user_id: payload.userId || "unknown",
                user_email: payload.userEmail || "unknown",
                user_role: payload.userRole || "unknown",
                action: payload.action || "unknown",
                entity_type: "patient",
                entity_id: payload.patientId || "unknown",
                success: false,
                error_message: err.message,
                risk_level: "critical",
            });
        }
        catch (auditError) {
            error("Failed to audit error:", auditError);
        }
        return res.json({
            success: false,
            error: err.message || "Internal server error",
        }, 500);
    }
};
