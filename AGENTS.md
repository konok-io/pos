# POS Management System - Agent Instructions

## Important Rules

### 1. Always Run Build Commands at the End
After completing any work, ALWAYS run these commands in order:
```bash
cd /workspace/project/pos
npm run build
```

### 2. Always Add Translations for New Features
When adding any new feature or text to the application:
- Update ALL translation files in `client/src/i18n/`:
  - `bn.ts` (Bangla)
  - `en.ts` (English)
  - `hi.ts` (Hindi)
  - `ar.ts` (Arabic)

## Translation Keys Already Added
- `posManagementSystem` - POS Management System
- `smartBusinessPartner` - Smart Business Partner

## Build Commands
```bash
cd /workspace/project/pos
npm run build
```

## Git Commands
```bash
git add -A
git commit -m "message"
git push origin main
```
