import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildIcs } from '../../lib/ics';

export async function getStaticPaths() {
  const events = await getCollection('events');
  return events.map((e) => ({ params: { slug: e.id }, props: { event: e } }));
}

export const GET: APIRoute = ({ props }) => {
  const e = (props as any).event;
  const ics = buildIcs({
    uid: `${e.id}@maennerkreis`, title: e.data.title, description: e.data.excerpt,
    location: e.data.locationName, start: e.data.date, end: e.data.endTime,
  });
  return new Response(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
