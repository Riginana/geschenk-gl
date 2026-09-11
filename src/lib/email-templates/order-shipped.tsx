import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface OrderShippedProps {
  customerName?: string
  orderId?: string
  carrierLabel?: string
  trackingNumber?: string | null
  trackingUrl?: string | null
  address?: string[]
  items?: { name: string; qty: number }[]
}

export function OrderShippedEmail({
  customerName = 'Kundin/Kunde',
  orderId = '',
  carrierLabel = 'DHL',
  trackingNumber = null,
  trackingUrl = null,
  address = [],
  items = [],
}: OrderShippedProps) {
  return (
    <Html lang="de">
      <Head />
      <Preview>Deine Bestellung ist unterwegs</Preview>
      <Body style={{ backgroundColor: '#faf7f2', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '32px', maxWidth: '560px' }}>
          <Heading style={{ fontSize: '22px', color: '#3b2f2a', margin: '0 0 16px' }}>
            Deine Bestellung ist unterwegs
          </Heading>
          <Text style={{ color: '#3b2f2a' }}>Hallo {customerName},</Text>
          <Text style={{ color: '#3b2f2a' }}>
            gute Nachrichten: Deine Bestellung {orderId ? `#${orderId.slice(0, 8)}` : ''} wurde
            versendet.
          </Text>

          {trackingNumber ? (
            <Section style={{ margin: '20px 0' }}>
              <Text style={{ color: '#3b2f2a', margin: '0 0 8px' }}>
                {carrierLabel} Sendungsnummer: <strong>{trackingNumber}</strong>
              </Text>
              {trackingUrl ? (
                <Button
                  href={trackingUrl}
                  style={{
                    backgroundColor: '#a97142',
                    color: '#ffffff',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    fontSize: '15px',
                  }}
                >
                  Sendung verfolgen
                </Button>
              ) : null}
            </Section>
          ) : null}

          {address.length ? (
            <>
              <Hr />
              <Text style={{ color: '#3b2f2a', fontWeight: 'bold', marginBottom: '4px' }}>
                Lieferadresse
              </Text>
              {address.map((line) => (
                <Text key={line} style={{ color: '#5b4b42', margin: '0' }}>
                  {line}
                </Text>
              ))}
            </>
          ) : null}

          {items.length ? (
            <>
              <Hr />
              <Text style={{ color: '#3b2f2a', fontWeight: 'bold', marginBottom: '4px' }}>
                Deine Artikel
              </Text>
              {items.map((it, i) => (
                <Text key={`${it.name}-${i}`} style={{ color: '#5b4b42', margin: '0' }}>
                  {it.qty}× {it.name}
                </Text>
              ))}
            </>
          ) : null}

          <Hr />
          <Text style={{ color: '#8a7a70', fontSize: '13px' }}>
            Vielen Dank für dein Vertrauen — DigiNutz
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderShippedEmail,
  subject: 'Deine Bestellung ist unterwegs',
  displayName: 'Versandbestätigung',
  previewData: {
    customerName: 'Anna',
    orderId: '3f7a1c2e-0000-0000-0000-000000000000',
    carrierLabel: 'DHL',
    trackingNumber: '00340434161094042557',
    trackingUrl:
      'https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=00340434161094042557',
    address: ['Anna Muster', 'Karl-Bröger-Str 5', '91058 Erlangen', 'Deutschland'],
    items: [{ name: 'Holzbox M — Motiv 1', qty: 1 }],
  },
} satisfies TemplateEntry
