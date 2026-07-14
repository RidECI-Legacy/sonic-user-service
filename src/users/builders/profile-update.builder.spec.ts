import { ProfileUpdateBuilder } from './profile-update.builder';

describe('ProfileUpdateBuilder', () => {
  it('starts empty', () => {
    const builder = new ProfileUpdateBuilder();
    expect(builder.isEmpty()).toBe(true);
    expect(builder.build()).toEqual({});
  });

  it('ignores falsy values for each with* method', () => {
    const builder = new ProfileUpdateBuilder()
      .withPhone(undefined)
      .withDocumentType(undefined)
      .withPhoto(undefined);
    expect(builder.isEmpty()).toBe(true);
  });

  it('accumulates provided fields and is chainable', () => {
    const builder = new ProfileUpdateBuilder()
      .withPhone('+573001234567')
      .withDocumentType('CC')
      .withPhoto('https://example.com/photo.png');

    expect(builder.isEmpty()).toBe(false);
    expect(builder.build()).toEqual({
      phone: '+573001234567',
      documentType: 'CC',
      photo: 'https://example.com/photo.png',
    });
  });

  it('only includes the fields that were actually set', () => {
    const builder = new ProfileUpdateBuilder().withPhone('+573001234567');
    expect(builder.build()).toEqual({ phone: '+573001234567' });
  });
});
