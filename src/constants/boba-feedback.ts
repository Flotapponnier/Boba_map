/**
 * Boba avatars and their personalities for feedback
 */

export interface BobaAvatar {
  id: string;
  name: string;
  image: string;
  personality: string;
}

export const BOBA_AVATARS: BobaAvatar[] = [
  {
    id: "golden",
    name: "Golden Boba",
    image: "/avatars/golden.png",
    personality: "luxury lover, appreciates quality",
  },
  {
    id: "pinky",
    name: "Pinky Boba",
    image: "/avatars/pinky.png",
    personality: "friendly, loves good vibes",
  },
  {
    id: "black",
    name: "Black Boba",
    image: "/avatars/black.png",
    personality: "cool, knows the best spots",
  },
  {
    id: "diamond",
    name: "Diamond Boba",
    image: "/avatars/diamond.png",
    personality: "premium taste, high standards",
  },
  {
    id: "smart",
    name: "Smart Boba",
    image: "/avatars/smart.png",
    personality: "analytical, finds best deals",
  },
  {
    id: "trophy",
    name: "Trophy Boba",
    image: "/avatars/trophy.png",
    personality: "winner, only recommends the best",
  },
];

/**
 * Feedback templates based on category and price
 */
const FEEDBACK_TEMPLATES = {
  accommodation: {
    cheap: [
      "Great value for ETH Denver! Perfect for builders 💰",
      "Clean and cozy! You won't find better at this price 🛏️",
      "I stayed here last month - super comfy! 😴",
      "Best budget option in Denver, trust me! ⭐",
      "Save money, spend on hackathons! Smart choice 🧠",
    ],
    expensive: [
      "Pure luxury! Treat yourself after shipping 🚀",
      "The spa here is AMAZING! 5 stars all the way 🌟",
      "This is where I go for special occasions 🎉",
      "Top-tier service, worth every dollar 💎",
      "The views from the rooftop... Denver mountains! 🏔️",
    ],
  },
  food: {
    cheap: [
      "Best tacos in Denver! My go-to spot 🌮",
      "Huge portions, tiny prices! Love it 😋",
      "The secret sauce is legendary! 🤫",
      "ETH Denver devs come here every day 👌",
      "Authentic Colorado taste, friendly staff! ❤️",
    ],
    expensive: [
      "Michelin-quality experience! Chef's kiss 👨‍🍳",
      "The tasting menu is a journey! 🍽️",
      "Perfect for celebrating your grant! 💕",
      "Best fine dining in Denver, period. 🏆",
      "The craft beer pairing is exceptional! 🍺",
    ],
  },
  event: {
    default: [
      "Met amazing builders here! Great community 🤝",
      "Don't miss this side event! Super interesting 🎯",
      "I learned so much about web3! Highly recommend 📚",
      "The energy at ETH Denver is incredible! ⚡",
      "Best networking opportunity for builders 🌐",
    ],
  },
  nightlife: {
    default: [
      "The DJ here is fire! 🔥",
      "Best cocktails in Denver! 🍸",
      "Vibes are immaculate! Party time 🎊",
      "ETH Denver after parties here! 💃",
      "My favorite spot for a night out! 🌙",
    ],
  },
  activity: {
    default: [
      "So much fun! Learned something new 🎓",
      "Great instructors, super patient! 👏",
      "I've improved so much since I started! 📈",
      "Perfect for beginners and pros alike! 🎯",
      "Best investment in yourself! 💪",
    ],
  },
  service: {
    default: [
      "Super productive here! Great wifi 💻",
      "Perfect spot to work! Quiet and comfy ☕",
      "The atmosphere is just right! 🎧",
      "I finished my project here! Recommended 📝",
      "Free and fantastic! What more do you need? 🆓",
    ],
  },
};

/**
 * Get a random Boba avatar
 */
export function getRandomAvatar(): BobaAvatar {
  const index = Math.floor(Math.random() * BOBA_AVATARS.length);
  return BOBA_AVATARS[index];
}

/**
 * Get avatar by index (for consistent assignment)
 */
export function getAvatarByIndex(index: number): BobaAvatar {
  // Handle negative indices (e.g., when findIndex returns -1)
  const safeIndex = Math.abs(index) % BOBA_AVATARS.length;
  return BOBA_AVATARS[safeIndex];
}

/**
 * Get feedback for a place
 */
export function getFeedback(
  category: string,
  price: number | undefined,
  index: number
): string {
  const categoryKey = category as keyof typeof FEEDBACK_TEMPLATES;
  const templates = FEEDBACK_TEMPLATES[categoryKey];

  if (!templates) {
    // Default feedback
    return "I love this place! Definitely check it out! ⭐";
  }

  // Determine if cheap or expensive
  let feedbackArray: string[];

  if ("default" in templates) {
    feedbackArray = templates.default;
  } else if (price !== undefined && price < 50) {
    feedbackArray = templates.cheap;
  } else {
    feedbackArray = templates.expensive;
  }

  // Handle negative indices
  const safeIndex = Math.abs(index) % feedbackArray.length;
  return feedbackArray[safeIndex];
}

/**
 * Generate booking link based on place name and category
 */
export function getBookingLink(name: string, category: string): string | null {
  const encodedName = encodeURIComponent(name);
  const encodedCity = encodeURIComponent("Denver");

  switch (category) {
    case "accommodation":
      return `https://www.booking.com/searchresults.html?ss=${encodedName}+${encodedCity}`;
    case "food":
      return `https://www.tripadvisor.com/Search?q=${encodedName}+${encodedCity}`;
    case "event":
      return `https://www.meetup.com/find/?keywords=${encodedName}&location=${encodedCity}`;
    default:
      return `https://www.google.com/search?q=${encodedName}+${encodedCity}`;
  }
}








