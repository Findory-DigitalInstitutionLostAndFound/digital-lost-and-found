# Frontend

This folder contains the React frontend for the digital lost-and-found application.

## Prerequisites

- Node.js
- npm
- Run the commands below from the frontend project directory.

## Install dependencies

Install the required packages:

```bash
npm install
```
## Run the frontend

Start the development server:

```bash
npm run dev
```
The frontend will be available at http://localhost:5173.

Press Ctrl+C to stop the development server.

## Build the application

To create a production build, run:
```bash
npm run build
```
The generated files will be saved in the dist directory.

## Run ESLint

To check the code for errors and issues, run:

```bash
npm run lint
```
## Updating dependencies

After adding or changing dependencies, run:
```bash
npm install
```
To install a new package, use:
```bash
npm install package-name
```
## Troubleshooting

Check that Node.js and npm are installed:
```bash
node --version
npm --version
```
If packages are missing, run:
```bash
npm install
```
If port 5173 is already in use, Vite may automatically select another available port. Check the terminal output for the correct address.

## Environment variables

Store frontend environment variables in a .env file in the frontend project directory.

For example:
```bash
VITE_API_URL=http://127.0.0.1:8000
```
Environment variables used in the frontend must start with VITE_. Do not store private keys, service-role keys, or other secret credentials in this file.
