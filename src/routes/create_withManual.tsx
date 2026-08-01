import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/create_withManual')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/create_withManual"!</div>
}
