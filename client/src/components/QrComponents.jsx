import { QRCodeSVG } from 'qrcode.react';
import { getShareUrl } from '../utils/config.js';

const QrComponents = ({ sessionId }) => {
    if (!sessionId) {
        return (
            <div className="qr-loading">
                <div className="spinner"></div>
                <p>Generating secure tunnel...</p>
            </div>
        );
    }

    const shareUrl = getShareUrl(sessionId);

    return (
        <div className="qr-card">
            <div className="qr-wrapper">
                <QRCodeSVG
                    value={shareUrl}
                    size={240}
                    bgColor={"#ffffff"}
                    fgColor={"#0f172a"}
                    level={"H"}
                    includeMargin={true}
                    className="qr-code-svg"
                />
            </div>
        </div>
    );
};

export default QrComponents;
