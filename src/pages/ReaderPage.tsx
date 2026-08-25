import { useParams } from 'react-router-dom'

export function ReaderPage() {
  const { id } = useParams()
  return <h1>阅读器 {id}</h1>
}
