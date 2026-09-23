import type { Contact, PhoneStore } from './config';

export function createContact(store: PhoneStore, input: Pick<Contact, 'name' | 'role' | 'context'> & Partial<Pick<Contact, 'color'>>): PhoneStore {
  const name = input.name.trim();
  if (!name) throw new Error('A contact needs a name.');
  const initials = name.split(/\s+/).slice(0, 2).map(part => part[0].toUpperCase()).join('');
  const contact: Contact = {
    id: `contact-${crypto.randomUUID()}`,
    name,
    initials,
    role: input.role.trim(),
    context: input.context.trim(),
    color: input.color || '#8da5bd',
  };
  return { ...store, contacts: [contact, ...store.contacts] };
}