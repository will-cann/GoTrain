import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Loader2 } from 'lucide-react';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface AskCoachProps {
    messages: ChatMessage[];
    onSendMessage: (content: string) => void;
    isLoading: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export const AskCoach: React.FC<AskCoachProps> = ({ messages, onSendMessage, isLoading, isOpen, onClose }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input.trim());
        setInput('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Mobile backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    />

                    {/* Panel */}
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                        className="
                            w-full sm:w-[380px] lg:w-[360px] xl:w-[400px]
                            border-l border-edge bg-black
                            flex flex-col shrink-0
                            fixed inset-y-0 right-0 z-50
                            lg:relative lg:z-auto
                        "
                    >
                        {/* Header */}
                        <div className="px-5 py-3.5 flex items-center justify-between border-b border-edge shrink-0">
                            <div>
                                <h3 className="font-semibold text-chalk text-[0.9375rem]">Coach</h3>
                                <p className="label-caps mt-0.5">AI Training Assistant</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-muted hover:text-chalk p-1 transition-colors lg:hidden"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                    <h4 className="text-[0.9375rem] font-semibold text-chalk mb-2">Your AI Coach</h4>
                                    <p className="text-[0.8125rem] text-muted leading-[1.65] max-w-[28ch]">
                                        Ask about your plan, request changes, or get training advice.
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] px-4 py-2.5 text-[0.875rem] leading-[1.6] ${msg.role === 'user'
                                        ? 'bg-accent text-black'
                                        : 'bg-surface border border-edge text-chalk'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-surface border border-edge px-4 py-2.5 text-dim text-[0.875rem] flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-3 border-t border-edge flex gap-2 shrink-0">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask your coach..."
                                className="flex-1 bg-surface border border-edge px-4 py-2.5 text-[0.875rem] text-chalk placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="bg-accent hover:bg-accent-hover disabled:opacity-30 text-black p-2.5 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};
