Invoice Gen
Invoice Gen is a web application for creating and managing invoices. It provides a dashboard for tracking invoice statuses and totals, with JSON Server used as a mock REST API for local development.
Features
- Dashboard summaries for outstanding, overdue, and paid invoices.
- Invoice listing, creation, status updates, and deletion through REST API helpers.
- Invoice statuses: Draft, Unpaid, Paid, and Overdue.
- Form validation before saving invoice details.
- Invoice subtotal, tax, discount, and total calculations.
- Dashboard currency conversion using ExchangeRate-API.
- Automated tests for API helpers, validation, and calculations.


Technology Stack
- HTML, CSS, and JavaScript
- Vite
- JSON Server
- Vitest
- ExchangeRate-API: https://open.er-api.com/v6/latest/{BASE}
Project Structure
invoice-generator/
├── css/
├── docs/
├── js/
│   ├── api.js
│   ├── invoice.js
│   ├── main.js
│   ├── ui.js
│   └── validation.js
├── server/
│   └── server.js
├── tests/
│   ├── api.test.js
│   ├── invoice.test.js
│   └── validation.test.js
├── db.json
├── index.html
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
The structure may vary slightly as development continues.
Requirements
- Node.js and npm
- Git
Getting Started
1. Clone the repository
Replace the placeholder with your GitHub repository URL:
git clone <your-repository-url>
cd invoice-generator
2. Install dependencies
npm install
3. Start JSON Server
In one terminal, run:
npm run server
The invoices endpoint should be available at:
http://localhost:3000/invoices
Keep this terminal running.
4. Start the frontend
Open a second terminal in the project directory and run:
npm run dev
Open the local URL printed by Vite in your browser.
Available Commands
Command	Purpose
npm install	Install project dependencies
npm run dev	Start the Vite development server
npm run build	Build the frontend for production
npm run server	Start JSON Server using db.json
npm test	Run the Vitest test suite


Mock API and Invoice Data
JSON Server uses db.json to persist invoice records during local development. The API helper module (js/api.js) includes functions for retrieving, creating, updating, and deleting invoices.

Common REST operations include:
- GET to retrieve invoices
- POST to create an invoice
- PATCH to update an invoice status
- DELETE to remove an invoice
Invoice fields used in the project may include an invoice number, client name and email, description, issue and due dates, quantity, unit price, tax rate, discount, currency, and status. Refer to the current form and db.json for the exact data model.
Currency Conversion
The dashboard uses exchange rates from:
https://open.er-api.com/v6/latest/{BASE}
Replace {BASE} with a base currency code, such as KES. An internet connection is required for live exchange-rate requests, and the external service may occasionally be unavailable.
Testing
Run tests with:
npm test
The test suite covers API helpers, invoice validation, and invoice calculation functions. Run tests after making changes to help detect regressions.
Error Handling
The application should provide useful feedback for failed API requests, invalid invoice details, and unavailable exchange rates. Loading feedback should be shown while asynchronous operations are in progress.
Deployment
Build the frontend with:
npm run build
Vite places the production build in the dist/ directory.

Important: JSON Server is a development mock backend, not a production database. A deployed frontend cannot use http://localhost:3000 to reach a server running on a visitor's own computer. For production, host the API and data service separately and configure the frontend to use the deployed API URL.

If deploying the frontend to GitHub Pages, deploy the frontend build and configure any required API services separately.
Security Notes
- Never commit API keys, passwords, or other secrets.
- Keep .env files out of version control.
- Do not expose a secret PDF-generation API key in browser JavaScript. If Invovate requires a secret key, use a secure server-side or serverless function.
- Do not use local JSON Server as a production data store.
Current Development Status
Developed features:
- Dashboard and invoice listing
- Invoice filtering and status management
- JSON Server CRUD helpers
- Invoice form validation
- Invoice calculations
- Automated tests for API helpers, validation, and calculations
- Currency conversion for dashboard summaries
Planned / not yet complete:
- Invovate PDF-generation API integration
- PDF-generation loading/error states and download flow
- Final production API configuration and deployment verification
Update this section as features are completed and tested.
Contributing
For coursework development, use feature branches and descriptive commits. Test changes before opening a pull request.

Example:
git checkout -b feature/invoice-pdf
Only commit a feature once it has actually been implemented and tested.
License
The project currently declares the ISC license in package.json. See the repository's LICENSE file for the license text.