// ─── Framer Motion Page Transition Wrapper ───
import { motion } from 'framer-motion'

const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
}

const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3,
}

export default function PageTransition({ children, className = '' }) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// Stagger container for lists
export const staggerContainer = {
    animate: {
        transition: { staggerChildren: 0.06 }
    }
}

export const staggerItem = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}
