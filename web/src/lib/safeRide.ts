// Get Home Safe — shuffled ride services and rotating safety messages

export interface SafeRideOption {
    name: string
    url: string
    emoji: string
}

const RIDE_SERVICES: SafeRideOption[] = [
    { name: 'Uber', url: 'https://www.uber.com', emoji: '🚗' },
    { name: 'Lyft', url: 'https://www.lyft.com', emoji: '🚕' },
    { name: 'Uber', url: 'https://m.uber.com', emoji: '🚙' },
    { name: 'Lyft', url: 'https://ride.lyft.com', emoji: '🚖' },
]

const SAFETY_MESSAGES = [
    '🏠 Get Home Safe',
    '🚫 Don\'t Drink & Drive',
    '🚕 Call a Ride',
    '🛡️ Stay Safe Tonight',
    '🏡 Your Bed Misses You',
    '💛 Be Smart, Get a Ride',
    '🚗 Uber or Lyft, Just Go',
    '✌️ Peace Out Safely',
    '🌙 Night\'s Over, Ride Home',
    '🫶 Friends Don\'t Let Friends Drive',
]

export function getRandomRide(): SafeRideOption {
    return RIDE_SERVICES[Math.floor(Math.random() * RIDE_SERVICES.length)]
}

export function getRandomSafetyMessage(): string {
    return SAFETY_MESSAGES[Math.floor(Math.random() * SAFETY_MESSAGES.length)]
}
