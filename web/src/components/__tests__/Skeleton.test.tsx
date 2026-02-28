import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import SkeletonBox, { SkeletonCard, SkeletonList } from '../Skeleton'

describe('Skeleton Components', () => {
    it('renders SkeletonBox with custom dimensions', () => {
        const { container } = render(<SkeletonBox width="50%" height="2rem" />)
        const el = container.querySelector('.skeleton')
        expect(el).toBeInTheDocument()
        expect(el).toHaveStyle({ width: '50%', height: '2rem' })
    })

    it('renders SkeletonCard', () => {
        const { container } = render(<SkeletonCard />)
        expect(container.querySelector('.card')).toBeInTheDocument()
    })

    it('renders SkeletonList with default 3 items', () => {
        const { container } = render(<SkeletonList />)
        expect(container.querySelectorAll('.card')).toHaveLength(3)
    })

    it('renders SkeletonList with custom count', () => {
        const { container } = render(<SkeletonList count={5} />)
        expect(container.querySelectorAll('.card')).toHaveLength(5)
    })
})
