import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface OrderReceivedProps {
  customerName?: string
  orderId?: string
}

const c = { color: '#3b2f2a' }

export function OrderReceivedEmail({ customerName = 'Kundin/Kunde', orderId = '' }: OrderReceivedProps) {
  return (
    <Html lang="de">
      <Head />
      <Preview>Vielen Dank für Ihre Bestellung bei DigiNutz</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '32px', maxWidth: '560px' }}>
          <Heading style={{ fontSize: '22px', color: '#3b2f2a', margin: '0 0 16px' }}>
            Vielen Dank für Ihre Bestellung bei DigiNutz
          </Heading>
          <Text style={c}>Hallo {customerName},</Text>
          <Text style={c}>
            vielen Dank für Ihre Bestellung bei DigiNutz! Wir haben Ihre Bestellung erfolgreich erhalten
            und freuen uns, Ihr persönliches Geschenk für Sie anzufertigen.
          </Text>
          {orderId ? (
            <Text style={c}>
              Ihre Bestellnummer: {orderId.slice(0, 8)}
            </Text>
          ) : null}
          <Text style={c}>
            Sobald Ihre Bestellung versendet wurde, erhalten Sie eine weitere Nachricht mit den
            Versandinformationen.
          </Text>
          <Hr />
          <Text style={c}>Vielen Dank für Ihr Vertrauen!</Text>
          <Text style={c}>Liebe Grüße{'\n'}DigiNutz</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderReceivedEmail,
  subject: 'Vielen Dank für Ihre Bestellung bei DigiNutz',
  displayName: 'Bestellbestätigung',
  previewData: {
    customerName: 'Anna',
    orderId: 'c93bb67e-e325',
  },
} satisfies TemplateEntry
