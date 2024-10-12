// Import node-fetch to make HTTP requests
const fetch = require('node-fetch');

// Function to fetch invoices from the API
const fetchInvoices = async () => {
  try {
    const response = await fetch('https://invoicing-software.onrender.com/api/logout');
    const data = await response;

    // Log the response data (invoices)
    console.log('Invoices:', data);
  } catch (error) {
    console.error('Error fetching invoices:', error);
  }
};

// Call the fetchInvoices function every minute (60000 ms)
setInterval(fetchInvoices, 60000);

// Fetch invoices immediately when the app starts
fetchInvoices();
