import { Bot, User } from 'lucide-react'

export default function ChatBubble({ message, isBot, timestamp }) {
    return (
        <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
            {isBot && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-wood-100 to-beige-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-wood-600" />
                </div>
            )}
            <div className={`max-w-[75%] sm:max-w-[65%]`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isBot
                        ? 'bg-white/80 text-wood-800 border border-wood-100 rounded-tl-md shadow-sm'
                        : 'bg-gradient-to-r from-wood-600 to-wood-500 text-white rounded-tr-md shadow-md'
                    }`}>
                    {message}
                </div>
                {timestamp && (
                    <p className={`text-[10px] mt-1 ${isBot ? 'text-wood-400' : 'text-wood-400 text-right'}`}>
                        {timestamp}
                    </p>
                )}
            </div>
            {!isBot && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-beige-200 to-wood-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-wood-600" />
                </div>
            )}
        </div>
    )
}
