"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Star } from "lucide-react"
import { toast } from "sonner"

interface FeedbackDialogProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (rating: number, comment?: string) => Promise<void>
    listenerName: string
}

export function FeedbackDialog({ isOpen, onClose, onSubmit, listenerName }: FeedbackDialogProps) {
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (rating === 0) return

        setIsSubmitting(true)
        try {
            await onSubmit(rating, comment.trim() || undefined)
            toast.success("Thank you for your feedback!")
            onClose()
            // Reset form
            setRating(0)
            setComment("")
        } catch (error) {
            console.error("Failed to submit feedback:", error)
            toast.error("Failed to submit feedback. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSkip = () => {
        onClose()
        setRating(0)
        setComment("")
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Rate Your Experience</DialogTitle>
                    <DialogDescription>
                        How was your conversation with {listenerName}?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Star Rating */}
                    <div className="flex justify-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="p-1 transition-colors"
                            >
                                <Star
                                    className={`h-8 w-8 ${star <= (hoveredRating || rating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    {rating > 0 && (
                        <p className="text-center text-sm text-gray-600">
                            {rating === 1 && "Poor"}
                            {rating === 2 && "Fair"}
                            {rating === 3 && "Good"}
                            {rating === 4 && "Very Good"}
                            {rating === 5 && "Excellent"}
                        </p>
                    )}

                    {/* Optional Comment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional feedback (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your thoughts about the conversation..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={handleSkip}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Skip
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={rating === 0 || isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}