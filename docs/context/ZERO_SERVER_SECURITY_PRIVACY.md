# Zero-Server Architecture: Security & Privacy

Context document for DocumentFlow Suite: security and privacy narrative for the External Manual and IT/security audiences. Merged from Zero-Server Architecture – Security & Privacy.

---

## 1. Why this page matters

In the financial and retirement sector, **"How do you handle the data?"** is often the first question. Framing the architecture as **Privacy-by-Design** turns a technical choice (browser-side processing to save server costs) into a competitive advantage.

---

## 2. Client-Side First philosophy

The DocumentFlow Suite is built on a **Client-Side First** philosophy. Unlike traditional document conversion services that upload files to a remote server, DocumentFlow performs all operations **locally within the user's web browser session**.

---

## 3. The local processing boundary

When a user selects a file for triage, the data is loaded into the browser's **volatile memory (RAM)**.

- **No intermediate storage:** Files are never written to temporary disk or a cloud "staging" area during conversion.  
- **Encryption in transit:** The "transfer" is from the user's hard drive to the user's RAM; data does not cross the open internet for processing.  
- **Volatile session:** When the browser tab is closed, memory is cleared. No residue of the document remains.  

---

## 4. Comparison of security models

| Feature        | Traditional cloud converters   | DocumentFlow Suite        |
|----------------|---------------------------------|----------------------------|
| Data location  | Processed on 3rd-party servers | Processed on local machine |
| Data retention | Often 24–48 hours              | Instantaneous (RAM only)   |
| PII exposure   | High risk (in transit/at rest)  | Zero risk (data never leaves) |
| Compliance     | Complex BAA/SOC2 audits         | Inherently HIPAA/SOC2 friendly |

---

## 5. Technical safeguards

- **Web Workers:** Heavy processing (e.g. HEIC-to-PDF) runs in a background thread. UI stays responsive; file data is isolated from the main window's global scope.  
- **Subresource Integrity (SRI):** Cryptographic and PDF libraries are loaded with SRI hashes so the code running in the browser has not been tampered with.  
- **Content Security Policy (CSP):** The tool is designed to run under strict CSP headers to prevent data from being sent to unauthorized external domains.  

---

## 6. Regulatory alignment

Keeping data local simplifies compliance:

- **GDPR/CCPA:** No data "collected" or "stored" in the traditional sense; many data-at-rest requirements are bypassed.  
- **GLBA (Gramm-Leach-Bliley Act):** Supports protection of non-public personal information by ensuring it is not sent to unverified third-party processing nodes.  

---

## 7. Why IT departments value this

"Shadow IT" (employees using random websites to convert PDFs) is a major concern for security officers. DocumentFlow provides a **sanctioned, secure alternative** that keeps company data inside the corporate perimeter.

---

*Source docx: Zero-Server Architecture – Security & Privacy.*
