import { Star, X } from 'lucide-react'
import { useState } from 'react'
import { message } from 'antd'
import type { AxiosError } from 'axios'
import { extractApiError } from '../../../shared/api/errors'
import type { BookingDto } from '../../bookings/types/bookingTypes'
import { createReview } from '../api/reviewApi'

const lotImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHGhZB7r5CICHHxjyLNU6J4q27mv_a5kTKpdpl3wv6g0N6tnnaBBw8K3rFB_3xZ0zpDNNfHClvgSCt5DODDCtuQCgQJcvLkfqeJqubvfqdcesw2ZwEQZSXjTXY3lNfZIfUNkne4b71MpIh7pVvEeqN7xt6wEaeXF5F7orqlVYBh0PzRW-GRnMlQppi_xbVdIUwx2I5W3wb96lNzJrKCj8KUVtJUWugliE40nirCCJ77cgOU8O-1vLT6w'
const labels = ['', 'Rất tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Tuyệt vời']

export function ReviewModal({ booking, onClose, onSuccess }: { booking: BookingDto; onClose: () => void; onSuccess: () => void }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async () => { if (!rating) { message.warning('Vui lòng chọn số sao đánh giá'); return } setSubmitting(true); try { await createReview({ bookingId: booking.id, rating, comment: comment.trim() || undefined }); message.success('Cảm ơn bạn đã đánh giá'); onSuccess() } catch (error) { message.error(extractApiError(error as AxiosError)) } finally { setSubmitting(false) } }
  const displayRating = hovered || rating
  return <div className="review-overlay" role="dialog" aria-modal="true" aria-labelledby="review-title"><div className="review-modal"><header><h2 id="review-title">Đánh giá bãi đỗ</h2><button type="button" onClick={onClose} aria-label="Đóng đánh giá"><X /></button></header><div className="review-body"><div className="review-lot"><img src={lotImage} alt="" /><div><strong>{booking.parkingLotName}</strong><span>{booking.parkingLotAddress}</span></div></div><h3>Trải nghiệm của bạn như thế nào?</h3><div className="review-stars" onMouseLeave={() => setHovered(0)}>{[1,2,3,4,5].map(value => <button type="button" key={value} onFocus={() => setHovered(value)} onBlur={() => setHovered(0)} onMouseEnter={() => setHovered(value)} onClick={() => setRating(value)} aria-pressed={rating === value} aria-label={`${value} sao`}><Star className={value <= displayRating ? 'filled' : ''} fill={value <= displayRating ? 'currentColor' : 'none'} /></button>)}</div><p className="rating-label" aria-live="polite">{labels[displayRating]}</p><label>Nhận xét chi tiết<textarea value={comment} maxLength={500} onChange={event => setComment(event.target.value)} placeholder="Chia sẻ thêm về trải nghiệm đỗ xe của bạn..." /><small>{comment.length}/500 ký tự</small></label></div><footer><button type="button" onClick={onClose}>Hủy</button><button type="button" className="submit-review" disabled={submitting || !rating} onClick={submit}>{submitting ? 'Đang gửi...' : 'Gửi đánh giá'}</button></footer></div></div>
}
