import { Container } from "react-bootstrap";

export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="pt-5">
      {children}
    </Container>
  )
}