# D-FARM POS

D-FARM POS is a React-based point-of-sale application with product import, sales history, summary export, user management, offline support, and responsive layout for desktop, tablet, and mobile screens.

## Project Structure

```text
src/
  App.js
  components/
    AppHeader.jsx
    LoginPage.jsx
  pages/
    PosPage.jsx
    Price.jsx
    HistoryPage.jsx
    SummaryPage.jsx
    UsersPage.jsx
  styles/
    uiStyles.js
  utils/
    salesSummary.js
  styles.css
```

## Requirements

- Node.js
- npm

## Install

```bash
npm install
```

## Run Locally

```bash
npm start
```

Open the app at:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Mobile Barcode Scanner

The POS page includes a camera-based barcode scanner using `html5-qrcode`. Barcode scanner supports EAN, UPC, CODE-128, CODE-39, ITF, and QR formats. On mobile devices, open the app in a browser, allow camera permission, and tap the scan button on the POS screen. Camera access works best on `localhost` during development or on an HTTPS deployment.

## Security Improvements

- Login is temporarily locked after repeated failed attempts.
- Local browser session storage no longer stores user passwords.
- The app logs out automatically after inactivity.
- User passwords are hidden by default and can be revealed only by pressing the visibility button.

## Notes

- The app uses Firebase configuration from `src/firebase.js`.
- Do not commit `node_modules` or local environment files.
- The layout has been adjusted to support desktop, tablet, and mobile screens.
