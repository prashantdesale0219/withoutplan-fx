import axios from 'axios';

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Create Razorpay order
export const createOrder = async (planName, amount) => {
  try {
    const response = await axios.post('/api/payment/create-order', {
      planName,
      amount
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'Failed to create order');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to create order');
  }
};

// Save payment details
export const savePayment = async (paymentDetails) => {
  try {
    const response = await axios.post('/api/payment/save', paymentDetails, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'Failed to save payment details');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error saving payment:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to save payment details');
  }
};

// Open Razorpay checkout
export const openRazorpayCheckout = (options) => {
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay(options);
    
    rzp.on('payment.success', (response) => {
      resolve(response);
    });
    
    rzp.on('payment.error', (error) => {
      reject(error);
    });
    
    rzp.open();
  });
};