import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import type { Prisma } from "@prisma/client";

type EventPayloadInput = {
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  mediaType: string;
  mediaUrl: string;
  registrationLink: string;
  registrationOpen: boolean;
};

type EventRegistrationResponses = Record<string, string | string[]>;

export async function getAllEvents() {
  return prisma.event.findMany({
    orderBy: { date: "asc" },
    include: { entries: true }
  });
}

export async function createEvent(userId: string, data: EventPayloadInput) {
  return prisma.event.create({
    data: {
      ...data,
      createdBy: userId,
      date: new Date(data.date),
    }
  });
}

export async function registerForEvent(userId: string | null, eventId: string, responses: EventRegistrationResponses) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw HttpError.notFound("Event not found");
  if (!event.registrationOpen) throw HttpError.badRequest("Registration is closed for this event");

  return prisma.eventEntry.create({
    data: {
      eventId,
      userId,
      responses: responses as Prisma.InputJsonValue,
    }
  });
}

export async function updateEvent(eventId: string, data: Partial<EventPayloadInput>) {
  return prisma.event.update({
    where: { id: eventId },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    }
  });
}

export async function deleteEvent(eventId: string) {
  return prisma.event.delete({ where: { id: eventId } });
}
