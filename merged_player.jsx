import { run, React, styled } from "uebersicht";

// - WIDGET SETTINGS -
const isSquareLayout = false; // Set to true for 1:1 player

// - APPLE SCRIPT -
export const command = `
osascript -e '
  if application "Spotify" is running then
    tell application "Spotify"
      if player state is playing or player state is paused then
        set trackName to name of current track
        set artistName to artist of current track
        set albumName to album of current track
        set albumArt to artwork url of current track
        set playerState to player state as string
        set playerPosition to player position
        return trackName & "%%" & artistName & "%%" & albumName & "%%" & albumArt & "%%" & playerState & "%%" & playerPosition
      else
        return "Not playing"
      end if
    end tell
  else
    return "Spotify not running"
  end if
'
`

export const refreshFrequency = (output) => {
  if (output.includes("%%paused%%")) {
    return 30000; // Refresh every 30 seconds when paused
  }
  // Refresh every second when playing
  return 1000; 
};

// - STYLING COMPONENTS -

const fadeIn = `@keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`;

// - Player Styles -
const PlayerContainer = styled('div')`
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #fff;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 15px;
  width: 400px;
  height: 200px;
  transition: all 0.4s ease-in-out;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  ${(props) => props.isSquare &&`
    width: 200px;
    height: 200px;
  `}
`;

const MainContent = styled('div')`
  display: flex;
  align-items: center;
  width: 100%;
`;

const AlbumArt = styled('div')`
  width: 150px;
  height: 150px;
  min-width: 150px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  background-size: cover;
  background-position: center;
  transition: all 0.3s ease-in-out;
  ${(props) => props.isSquare &&`
    width: 180px;
    height: 180px;
  `}
`;

const Info = styled('div')`
  padding-left: 15px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 150px;
  justify-content: space-between;

  ${(props) => props.isSquare &&`
    position: absolute; bottom: 10px; left: 10px; right: 10px;
    width: auto; height: auto; padding: 10px;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(12px); 
    border-radius: 8px; justify-content: center;
  `}
`;

const TrackInfo = styled('div')`
  animation: fade-in 0.4s ease-out;
  margin-top: 10px;
  ${(props) => props.isSquare &&`display: none;`}
`;

const Title = styled('div')`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Text = styled('div')`
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 5px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.9;
  &.album { font-size: 14px; font-weight: 400; opacity: 0.7; }
`;

const Controls = styled('div')`
  display: flex;
  align-items: center;
  ${(props) => props.isSquare &&`margin-top: 0; justify-content: center;`}
  button {
    background: none; border: none; color: #fff; cursor: pointer; opacity: 0.8;
    transition: opacity 0.2s, transform 0.2s; padding: 5px; display: flex;
    align-items: center; justify-content: center; margin: 0 10px;
    &:hover { opacity: 1; transform: scale(1.1); }
    &:first-of-type { margin-left: -5px; }
    svg { width: 20px; height: 20px; fill: currentColor; }
  }
`;

// - Lyrics -
const LyricsContainer = styled("div")`
  position: fixed;
  bottom: 50px;
  left: 50%;
  width: 80%;
  max-width: 900px;
  user-select: none;
  cursor: default;
  opacity: 0;
  transform: translate(-50%, 20px);
  pointer-events: none;
  transition: all 0.4s ease-in-out;
  
  ${(props) => props.isVisible && `
    opacity: 1;
    transform: translateX(-50%);
    pointer-events: auto;
  `}
`;

const LyricsWindow = styled("div")`
  height: 120px;
  overflow: hidden;
  position: relative;
`;

const LyricsSlider = styled("div")`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  text-align: center;
  transform: translateY(${(props) => props.offset}px);
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
`;

const LyricLine = styled("p")`
  margin: 0;
  font-weight: 500;
  line-height: 40px; 
  font-size: 20px;
  opacity: 0.5;
  filter: blur(1px);
  color: #fff;
  font-family: -apple-system, sans-serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  ${(props) => props.isCurrent && `
    opacity: 1; filter: none; font-size: 28px; transform: scale(1.05);
  `}
`;

const LyricsStatus = styled("div")`
  font-size: 18px;
  opacity: 0.7;
  text-align: center;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

// - ICONS -
const IconPrevious = ( <svg viewBox="0 0 24 24"><path d="M18.15 17.38V6.62a1.25 1.25 0 00-2.06-.91l-7.42 5.38a1.25 1.25 0 000 1.82l7.42 5.38a1.25 1.25 0 002.06-.91zM5.85 6.12a.5.5 0 00-.5.5v10.75a.5.5 0 00.5.5.5.5 0 00.5-.5V6.62a.5.5 0 00-.5-.5z"/></svg> );
const IconNext = ( <svg viewBox="0 0 24 24"><path d="M5.85 6.62v10.75a1.25 1.25 0 002.06.91l7.42-5.38a1.25 1.25 0 000-1.82L7.91 5.71a1.25 1.25 0 00-2.06.91zM18.15 17.88a.5.5 0 00.5-.5V6.62a.5.5 0 00-.5-.5.5.5 0 00-.5.5v10.75a.5.5 0 00.5.5z"/></svg> );
const IconPlay = ( <svg viewBox="0 0 24 24"><path d="M7.12 21.29a1.25 1.25 0 01-1.25-1.25V3.96a1.25 1.25 0 011.87-1.09l12.89 8.04a1.25 1.25 0 010 2.18l-12.89 8.04a1.23 1.23 0 01-.62.16z"/></svg> );
const IconPause = ( <svg viewBox="0 0 24 24"><path d="M8.38 4.62H5.5a1 1 0 00-1 1v12.75a1 1 0 001 1h2.88a1 1 0 001-1V5.62a1 1 0 00-1-1zm10.12 0h-2.88a1 1 0 00-1 1v12.75a1 1 0 001 1h2.88a1 1 0 001-1V5.62a1 1 0 00-1-1z"/></svg> );
const IconLyrics = ( <svg viewBox="0 0 24 24"><path d="M15.5 4.15a.5.5 0 00-.5.5v12.2a3.25 3.25 0 00-2.5-1.23c-1.8 0-3.25 1.46-3.25 3.25S10.7 22.12 12.5 22.12S15.75 20.66 15.75 18.87V7.8l5.4-1.62a.5.5 0 00.35-.47V4.15a.5.5 0 00-.5-.5h-5.5z"/></svg> );

// - HELPER FUNCTIONS -
const runAppleScript = (script) => run(`osascript -e '${script}'`);

const parseLRC = (lrcText) => {
  if (!lrcText) return [];
  const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;  // [mm:ss.xx] or [mm:ss.xxx]
  return lrcText.split("\n").map(line => {
    const match = line.match(regex);
    if (!match) return null;
    const [, minutes, seconds, milliseconds, text] = match;
    const time = parseInt(minutes) * 60 + parseInt(seconds) + parseInt(milliseconds) / 1000;
    return { time, text: text.trim() }; // Trim whitespaces 
  }).filter(Boolean);
};

// - LYRICS FETCH -
const fetchLyrics = async (track, artist, callback) => {
  try {
    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(artist)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    if (data && data.syncedLyrics) {
        const parsedLyrics = parseLRC(data.syncedLyrics);
        if (parsedLyrics.length > 0) callback({ status: '', lines: parsedLyrics }); // Successful
        else throw new Error('Synced lyrics format was invalid.');
    } else throw new Error('No synced lyrics found for this track.');
  } catch (error) {
    callback({ status: error.message, lines: [] });
  }
};

// - MAIN COMPONENT -
const SpotifyWidget = ({ output }) => {
  const [lyricsVisible, setLyricsVisible] = React.useState(true);
  const [lyrics, setLyrics] = React.useState({ status: 'Loading...', lines: [] });
  
  // Ref to hold the pause timer ID
  const pauseTimer = React.useRef(null);

  const [trackName, artistName, albumName, albumArt, playerState, positionStr] = output.split("%%");
  const position = parseFloat(positionStr);

  // - UPDATE LYRICS -
  React.useEffect(() => {
    setLyrics({ status: `Fetching lyrics for "${trackName}"...`, lines: [] });
    fetchLyrics(trackName, artistName, setLyrics);
  }, [trackName, artistName]);

  // - AUTO-HIDE LYRICS -
  React.useEffect(() => {
    // Reset any existing timers when state changes
    clearTimeout(pauseTimer.current);

    // If paused and lyrics are visible, start the timer to hide lyrics
    if (playerState === 'paused' && lyricsVisible) {
      pauseTimer.current = setTimeout(() => {
        setLyricsVisible(false);
      }, 60000); // 60 seconds
    }

    // Cleanup function to clear timer on next effect run
    return () => clearTimeout(pauseTimer.current);
  }, [playerState, lyricsVisible]);

  const showAlbumName = trackName.toLowerCase() !== albumName.toLowerCase() && !albumName.toLowerCase().includes('single');
  const playPauseIcon = playerState === 'playing' ? IconPause : IconPlay;

  let currentIndex = -1;
  if (lyrics.lines.length > 0) {
    currentIndex = lyrics.lines.findIndex(line => line.time > position) - 1;
    if (currentIndex < -1) currentIndex = -1;
    else if (currentIndex === -2) currentIndex = lyrics.lines.length - 1;
  }
  const offset = -(currentIndex * 40) + (120 / 2) - (40 / 2); // Center current line (depending on line height)
  
  return (
    <>
      <PlayerContainer isSquare={isSquareLayout}>
        <MainContent>
          <AlbumArt style={{ backgroundImage: `url(${albumArt})` }} isSquare={isSquareLayout} />
          <Info isSquare={isSquareLayout}>
            <TrackInfo isSquare={isSquareLayout}>
              <Title>{trackName}</Title>
              <Text>{artistName}</Text>
              {showAlbumName && <Text className="album">{albumName}</Text>}
            </TrackInfo>
            <Controls isSquare={isSquareLayout}>
              <button onClick={() => runAppleScript('tell application "Spotify" to previous track')}>{IconPrevious}</button>
              <button onClick={() => runAppleScript('tell application "Spotify" to playpause')}>{playPauseIcon}</button>
              <button onClick={() => runAppleScript('tell application "Spotify" to next track')}>{IconNext}</button>
              {!isSquareLayout && (
                <button onClick={() => setLyricsVisible(!lyricsVisible)}>{IconLyrics}</button>
              )}
            </Controls>
          </Info>
        </MainContent>
      </PlayerContainer>

      <LyricsContainer isVisible={lyricsVisible}>
        {lyrics.lines.length > 0 ? (
          <LyricsWindow>
            <LyricsSlider offset={offset}>
              {lyrics.lines.map((line, i) => (
                <LyricLine key={`${line.time}-${i}`} isCurrent={i === currentIndex}>
                  {line.text || "\u00A0"}
                </LyricLine>
              ))}
            </LyricsSlider>
          </LyricsWindow>
        ) : (
          <LyricsStatus>{lyrics.status}</LyricsStatus>
        )}
      </LyricsContainer>
    </>
  );
};

// - RENDER FUNCTION -
export const render = ({ output, error }) => {
  if (typeof window !== 'undefined' && !document.getElementById('spotify-widget-styles')) {
    const style = document.createElement('style');
    style.id = 'spotify-widget-styles';
    style.innerHTML = fadeIn;
    document.head.appendChild(style);
  }

  if (error) return <div>Error: {String(error)}</div>;
  const trimmedOutput = output.trim();
  if (trimmedOutput === "Spotify not running" || trimmedOutput === "Not playing" || trimmedOutput === "") {
    return <></>; 
  }
  
  return <SpotifyWidget output={trimmedOutput} />;
};