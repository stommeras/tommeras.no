'use client';

import { DecryptedText } from '@/components/ui/text-effects';
import { DECRYPT_PRESETS } from '@/components/ui/text-effects/constants';
import { Title } from '@/components/ui/Typography';
import { useBoopJump } from '@/hooks/useBoop';

const TITLE = 'TØMMERÅS';
const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function LandingTitle() {
  const [style, trigger] = useBoopJump();

  return (
    <Title className="relative cursor-pointer" tabIndex={0} role="button">
      <DecryptedText text={TITLE} characters={CHARACTERS} {...DECRYPT_PRESETS.dramatic} animateOn="both" />
    </Title>
  );
}
