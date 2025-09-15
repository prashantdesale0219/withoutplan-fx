export const pricingData = {
  title: {
    main: "Choose your plan",
    highlight: "and start generating images"
  },
  subtitle: "Select a plan that fits your needs",
  plans: [
    {
      id: "free",
      name: "Free",
      icon: "🆓",
      description: "Try our platform with limited features",
      price: 0,
      credits: 3,
      features: [
        { text: "3 AI-generated images", included: true },
        { text: "One-time per user", included: true },
        { text: "Basic editing tools", included: true },
        { text: "Standard resolution", included: true },
        { text: "Community support", included: true }
      ]
    },
    {
      id: "basic",
      name: "Basic",
      icon: "🚀",
      description: "Perfect for beginners and casual users",
      price: 399,
      credits: 50,
      features: [
        { text: "50 AI-generated images", included: true },
        { text: "Advanced editing tools", included: true },
        { text: "HD resolution", included: true },
        { text: "Email support", included: true },
        { text: "Monthly subscription", included: true }
      ]
    },
    {
      id: "pro",
      name: "Pro",
      icon: "⭐",
      description: "Recommended for professionals",
      price: 999,
      credits: 200,
      popular: true,
      features: [
        { text: "200 AI-generated images", included: true },
        { text: "Premium editing tools", included: true },
        { text: "4K resolution", included: true },
        { text: "Priority support", included: true },
        { text: "Commercial usage", included: true }
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      icon: "🏢",
      description: "For businesses with high volume needs",
      price: 2999,
      credits: 1000,
      features: [
        { text: "1000 AI-generated images", included: true },
        { text: "All premium features", included: true },
        { text: "Unlimited resolution", included: true },
        { text: "Dedicated support", included: true },
        { text: "API access", included: true },
        { text: "Custom branding", included: true }
      ]
    }
  ]
};