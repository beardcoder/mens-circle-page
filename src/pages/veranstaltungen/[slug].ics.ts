import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildIcs } from '../../lib/ics';

export async function getStaticPaths() {
  const events = await getCollection('events');
  return events.map((e) => ({ params: { slug: e.id }, props: { event: e } }));
}

export const GET: APIRoute = ({ props }) => {
  const e = (props as any).event;
  const [h, m] = String(e.data.endTime).split(':').map(Number);
  const end = new Date(e.data.date);
  end.setHours(h, m, 0, 0);
  const ics = buildIcs({
    uid: `${e.id}@maennerkreis`, title: e.data.title, description: e.data.excerpt,
    location: e.data.locationName, start: e.data.date, end,
  });
  return new Response(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
