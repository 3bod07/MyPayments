#!/usr/bin/env bash
# download-logos.sh  —  macOS / Linux / Git-Bash version of the logo downloader.
# Run on a machine with internet:   bash download-logos.sh
# Tries Clearbit first, then Google favicon. Saves <slug>.png in this folder.
set -u
cd "$(dirname "$0")"

# slug|domain|faviconDomain   (empty domain = no brand logo, skipped)
entries=(
  "chatgpt|openai.com|"
  "claude|anthropic.com|"
  "gemini|google.com|gemini.google.com"
  "perplexity|perplexity.ai|"
  "grok|x.ai|"
  "midjourney|midjourney.com|"
  "github-copilot|github.com|"
  "cursor|cursor.com|"
  "netflix|netflix.com|"
  "shahid|shahid.net|"
  "osn|osn.com|"
  "prime-video|primevideo.com|"
  "disney-plus|disneyplus.com|"
  "starzplay|starzplay.com|"
  "youtube-premium|youtube.com|"
  "apple-tv|apple.com|tv.apple.com"
  "spotify|spotify.com|"
  "apple-music|apple.com|music.apple.com"
  "anghami|anghami.com|"
  "youtube-music|youtube.com|music.youtube.com"
  "playstation-plus|playstation.com|"
  "xbox-game-pass|xbox.com|"
  "nintendo|nintendo.com|"
  "ea-play|ea.com|"
  "icloud|icloud.com|"
  "google-one|google.com|one.google.com"
  "dropbox|dropbox.com|"
  "onedrive|onedrive.com|onedrive.live.com"
  "microsoft-365|microsoft.com|office.com"
  "adobe-cc|adobe.com|"
  "canva|canva.com|"
  "notion|notion.so|"
  "linkedin|linkedin.com|"
  "figma|figma.com|"
  "tradingview|tradingview.com|"
  "etoro|etoro.com|"
  "investing|investing.com|"
  "stc|stc.com.sa|"
  "mobily|mobily.com.sa|"
  "zain|zain.com|sa.zain.com"
  "apple-fitness|apple.com|fitness.apple.com"
  "calm|calm.com|"
  "deepseek|deepseek.com|"
  "elevenlabs|elevenlabs.io|"
  "tod|tod.tv|"
  "bein-sports|beinsports.com|"
  "rotana|rotana.net|"
  "jawwy-tv|jawwy.sa|"
  "weyyak|weyyak.com|"
  "deezer|deezer.com|"
  "soundcloud|soundcloud.com|"
  "discord|discord.com|"
  "roblox|roblox.com|"
  "twitch|twitch.tv|"
  "hungerstation|hungerstation.com|"
  "jahez|jahez.net|"
  "mrsool|mrsool.co|"
  "toyou|toyou.io|"
  "thechefz|thechefz.co|"
  "noon|noon.com|"
  "amazon|amazon.sa|"
  "careem|careem.com|"
  "uber|uber.com|"
  "zoom|zoom.us|"
  "grammarly|grammarly.com|"
  "slack|slack.com|"
  "trello|trello.com|"
  "duolingo|duolingo.com|"
  "coursera|coursera.org|"
  "udemy|udemy.com|"
  "storytel|storytel.com|"
  "binance|binance.com|"
  "salam|salam.sa|"
  "lebara|lebara.sa|"
  "virgin-mobile|virginmobile.sa|"
  "fitness-time|fitnesstime.com.sa|"
  "headspace|headspace.com|"
)

ok=0; fav=0; skip=0; fail=0
for e in "${entries[@]}"; do
  IFS='|' read -r slug domain favd <<< "$e"
  out="$slug.png"
  if [ -z "$domain" ]; then echo "  --   $slug (no brand logo)"; skip=$((skip+1)); continue; fi
  [ -z "$favd" ] && favd="$domain"
  if curl -fsSL --max-time 25 "https://logo.clearbit.com/$domain?size=256" -o "$out" && [ "$(wc -c < "$out")" -gt 200 ]; then
    echo "  OK   $slug  <- clearbit ($domain)"; ok=$((ok+1))
  elif curl -fsSL --max-time 25 "https://www.google.com/s2/favicons?domain=$favd&sz=128" -o "$out" && [ "$(wc -c < "$out")" -gt 200 ]; then
    echo "  fav  $slug  <- favicon ($favd)"; fav=$((fav+1))
  else
    rm -f "$out"; echo "  XX   $slug  FAILED"; fail=$((fail+1))
  fi
done
echo ""
echo "Done. clearbit:$ok favicon:$fav skipped:$skip failed:$fail"
echo "To use offline in the app, set SUB_LOGO_LOCAL=true in index.html."
