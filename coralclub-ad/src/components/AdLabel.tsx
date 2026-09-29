// Werbekennzeichnung oben links, das ganze Video über sichtbar (§ 5a UWG,
// TikTok-Richtlinien für Branded Content). Liegt über allen Szenen und Wischern.
import {config} from '../config';
import {FONT, TEXT_WEIGHT} from '../theme';
import {SAFE} from '../video';

export const AdLabel: React.FC = () => (
	<div
		style={{
			position: 'absolute',
			left: SAFE.left,
			top: SAFE.top + 8,
			padding: '10px 22px 11px',
			borderRadius: 999,
			background: 'rgba(15, 12, 20, 0.62)',
			color: '#FFFFFF',
			fontFamily: FONT,
			fontWeight: TEXT_WEIGHT,
			fontSize: 28,
			lineHeight: 1,
			letterSpacing: '0.02em',
		}}
	>
		{config.werbung}
	</div>
);
