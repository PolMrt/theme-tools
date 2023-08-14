import { expect, describe, it } from 'vitest';
import { MissingAsset } from '.';
import { check } from '../../test';

describe('Module: MissingAsset', () => {
  it('should report the missing asset when assigned to a variable', async () => {
    const file = `
      {% assign logo_url = 'logo.png' | asset_url %}
      <img src="{{ logo_url }}" alt="Logo" />
    `;
    const files = {
      'snippets/snippet.liquid': file,
      'snippets/existing.liquid': '',
    };

    const offenses = await check(files, [MissingAsset]);

    expect(offenses).to.have.length(1);
    expect(offenses).to.containOffense({
      check: MissingAsset.meta.code,
      message: "'assets/logo.png' does not exist",
      absolutePath: '/snippets/snippet.liquid',
    });
  });

  it('should report the missing asset when defined inline', async () => {
    const file = `<link rel="stylesheet" href="{{ 'styles.css' | asset_url }}" />`;
    const files = {
      'snippets/snippet.liquid': file,
      'snippets/existing.liquid': '',
    };

    const offenses = await check(files, [MissingAsset]);

    expect(offenses).to.have.length(1);
    expect(offenses).to.containOffense({
      check: MissingAsset.meta.code,
      message: "'assets/styles.css' does not exist",
      absolutePath: '/snippets/snippet.liquid',
    });
  });

  it('should report the missing asset when multiple filters applied', async () => {
    const file = `<link rel="stylesheet" href="{{ 'styles.css' | asset_url | stylesheet_tag}}" />`;
    const files = {
      'snippets/snippet.liquid': file,
      'snippets/existing.liquid': '',
    };

    const offenses = await check(files, [MissingAsset]);

    expect(offenses).to.have.length(1);
    expect(offenses).to.containOffense({
      check: MissingAsset.meta.code,
      message: "'assets/styles.css' does not exist",
      absolutePath: '/snippets/snippet.liquid',
    });
  });

  it('should report no offenses when an asset file exists', async () => {
    const file = `<link rel="stylesheet" href="{{ 'styles.css' | asset_url }}" />`;
    const files = {
      'snippets/snippet.liquid': file,
      'assets/styles.css': '',
    };

    const offenses = await check(files, [MissingAsset]);

    expect(offenses).to.have.length(0);
  });
});
