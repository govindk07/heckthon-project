const adjectives = [
  "happy",
  "clever",
  "bright",
  "swift",
  "brave",
  "calm",
  "cool",
  "eager",
  "gentle",
  "kind",
  "lucky",
  "mighty",
  "noble",
  "proud",
  "quick",
  "smart",
  "strong",
  "wise",
  "young",
  "bold",
  "creative",
  "curious",
  "dynamic",
  "elegant",
  "friendly",
  "graceful",
  "honest",
  "inspired",
  "joyful",
];

const nouns = [
  "tiger",
  "eagle",
  "lion",
  "wolf",
  "bear",
  "fox",
  "hawk",
  "owl",
  "shark",
  "whale",
  "dragon",
  "phoenix",
  "falcon",
  "panther",
  "jaguar",
  "cheetah",
  "lynx",
  "otter",
  "dolphin",
  "penguin",
  "koala",
  "panda",
  "rabbit",
  "squirrel",
  "hedgehog",
  "badger",
  "raccoon",
  "deer",
  "moose",
];

export function generateRandomUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 9999) + 1;

  return `${adjective}${noun}${randomNum}`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long",
    };
  }
  return { isValid: true };
}
