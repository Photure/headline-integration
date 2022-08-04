export const convertFileNameToURIEncoded = (
  mediaURL: string,
  isVideo: boolean
) => {
  const indexOfNameStart = mediaURL.lastIndexOf("/");
  const unConvertedName = mediaURL.substring(indexOfNameStart + 1);
  const unConvertedNameTrimStart = unConvertedName.trimStart();
  const sanitizedName = findEmojis(unConvertedNameTrimStart.trim());
  const convertedName = convertTheRest(encodeURI(sanitizedName));
  const convertedURI = mediaURL.replace(unConvertedName, convertedName);
  const NFTStorageLinkURI = convertToNFTStorageLink(convertedURI);
  // NFTStorageLink Doesn't work with video yet
  return isVideo ? convertedURI : NFTStorageLinkURI;
};

const charactersNotEncodedMap = [
  "~",
  "#",
  "*",
  // '=',
  // ':',
  "?",
];

const conversionTable = ["%7e", "%23", "%2A", "%3F"];

const arrayOfUnhandledEmojis = ["%E2%98%95"];

export const convertTheRest = (sanitizedName: string): string => {
  let fullyConvertedName = "";
  sanitizedName.split("").forEach((character) => {
    const indexOfCharacter = charactersNotEncodedMap.indexOf(character);
    if (indexOfCharacter >= 0) {
      fullyConvertedName = `${fullyConvertedName}${conversionTable[indexOfCharacter]}`;
    } else {
      fullyConvertedName = `${fullyConvertedName}${character}`;
    }
  });
  let nameAfterHandlingEmojis;
  arrayOfUnhandledEmojis.forEach((emoji) => {
    if (fullyConvertedName.includes(emoji)) {
      nameAfterHandlingEmojis = fullyConvertedName.replace(emoji, "").trim();
      if (nameAfterHandlingEmojis.endsWith("%20")) {
        nameAfterHandlingEmojis = nameAfterHandlingEmojis.substring(
          0,
          nameAfterHandlingEmojis.length - 3
        );
      }
    }
  });

  if (fullyConvertedName.endsWith("%20")) {
    fullyConvertedName = fullyConvertedName.substring(
      0,
      fullyConvertedName.length - 3
    );
  }
  return nameAfterHandlingEmojis || fullyConvertedName;
};

const findEmojis = (s: string) => {
  const ranges = [
    // '\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
    "\ud83d[\udc00-\ude4f]", // U+1F400 to U+1F64F
    "\ud83d[\ude80-\udeff]", // U+1F680 to U+1F6FF
  ];
  const x = s.replace(new RegExp(ranges.join("|"), "g"), "");
  // if (x.includes('U+1f344')) {

  // }
  return x;
};

export const convertToNFTStorageLink = (mediaLink: string) =>
  mediaLink.replace("https://ipfs.io/ipfs/", "https://nftstorage.link/ipfs/");

export const ValidateEmail = (emailAddress: string) => {
  if (/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(emailAddress)) {
    return true;
  }
  return false;
};
