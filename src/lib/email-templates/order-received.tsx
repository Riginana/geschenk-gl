import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

export interface OrderReceivedProps {
  customerName?: string
  orderId?: string
  address?: string[]
  items?: { name: string; qty: number }[]
}

const c = { color: '#3b2f2a' }

export function OrderReceivedEmail({
  customerName = 'Kundin/Kunde',
  orderId = '',
  address = [],
  items = [],
}: OrderReceivedProps) {
  return (
    <Html lang="de">
      <Head />
      <Preview>Deine Bestellung ist angekommen</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '32px', maxWidth: '560px' }}>
          <Heading style={{ fontSize: '22px', color: '#3b2f2a', margin: '0 0 16px' }}>
            Deine Bestellung ist angekommen
          </Heading>
          <Text style={c}>Hallo {customerName},</Text>
          <Text style={c}>
            wir freuen uns, Dir mitzuteilen, dass Deine Bestellung{' '}
            {orderId ? `#${orderId.slice(0, 8)}` : ''} bei Dir angekommen ist.
          </Text>
          {items.length ? (
            <>
              <Hr />
              <Text style={{ ...c, fontWeight: 'bold', marginBottom: '4px' }}>Deine Artikel</Text>
              {items.map((it, i) => (
                <Text key={i} style={{ ...c, margin: '2px 0' }}>
                  {it.qty}× {it.name}
                </Text>
              ))}
            </>
          ) : null}
          {address.length ? (
            <>
              <Hr />
              <Text style={{ ...c, fontWeight: 'bold', marginBottom: '4px' }}>Lieferadresse</Text>
              {address.map((line, i) => (
                <Text key={i} style={{ ...c, margin: '2px 0' }}>
                  {line}
                </Text>
              ))}
            </>
          ) : null}
          <Hr />
          <Text style={c}>
            Vielen Dank für Dein Vertrauen! Wir hoffen, Dein Geschenk bereitet viel Freude. Über eine
            Bewertung würden wir uns sehr freuen. Bei Fragen antworte einfach auf diese E-Mail oder
            schreib uns an kontakt.diginutz@gmail.com.
          </Text>
          <Text style={c}>Herzliche Grüße{'\n'}Dein DigiNutz-Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderReceivedEmail,
  subject: 'Deine Bestellung ist angekommen',
  displayName: 'Bestellung erhalten',
  previewData: {
    customerName: 'Anna',
    orderId: 'c93bb67e-e325',
    address: ['Anna Muster', 'Hauptstr. 1', '10115 Berlin', 'Deutschland'],
    items: [{ name: 'Holzbox Hochzeit', qty: 1 }],
  },
} satisfies TemplateEntry
