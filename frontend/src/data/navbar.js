export const navbar =[
    
    {
        id:1,
        title:"Use Cases",
        link:"/use-cases"
    },
    {
        id:2,
        title:"Product",
        link:"/product"
    },
    {
        id:3,
        title:"Resources",
        link:"/",
        hasDropdown: true,
        dropdownItems: [
            {
                id: 1,
                title: "Blog",
                link: "/blog",
                icon: "FileText"
            },
            {
                id: 2,
                title: "Case Studies",
                link: "/case-studies",
                icon: "BookOpen"
            },
            {
                id: 3,
                title: "FAQs",
                link: "/faq",
                icon: "HelpCircle"
            }
        ]
    },
    {
        id:4,
        title:"Pricing",
        link:"/pricing"
    },
    {
        id:5,
        title:"Terms & Conditions",
        link:"/terms-and-conditions",
        hasDropdown: true,
           dropdownItems: [
            {
                id: 1,
                title: "Terms & Conditions",
                link: "/terms-and-conditions",
                icon: "FileText"
            },
            {
                id: 2,
                title: "Privacy Policy",
                link: "/terms-and-conditions/privacy-policy",
                icon: "Shield"
            },
            {
                id: 3,
                title: "Cancellation & Refunds",
                link: "/terms-and-conditions/cancellation-refunds",
                icon: "Refresh"
            }
        ]
    },
]