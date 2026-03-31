import type { MDXComponents } from 'mdx/types'
import { ContactForm } from './components/contact-form'
import { Card, CardBody, Col, Form, Row } from 'react-bootstrap'
import { SocialMediaLinks } from './components/social-media-links'
 
const components = {
  ContactForm,
  SocialMediaLinks,
  Form,
  Col,
  Row,
  Card,
  CardBody
} satisfies MDXComponents
 
export function useMDXComponents(): MDXComponents {
  return components
}
