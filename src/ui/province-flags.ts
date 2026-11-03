// Supplied waving assets are bundled as data URLs, so a downloaded page needs no image files.
import AB from "./flags/CA-AB.png";
import BC from "./flags/CA-BC.png";
import MB from "./flags/CA-MB.png";
import NB from "./flags/CA-NB.png";
import NL from "./flags/CA-NL.png";
import NS from "./flags/CA-NS.png";
import NT from "./flags/CA-NT.png";
import NU from "./flags/CA-NU.png";
import ON from "./flags/CA-ON.png";
import PE from "./flags/CA-PE.png";
import QC from "./flags/CA-QC.png";
import SK from "./flags/CA-SK.png";
import YT from "./flags/CA-YT.png";

export const provinceFlags: Record<string, string> = { AB, BC, MB, NB, NL, NS, NT, NU, ON, PE, QC, SK, YT };

export function setProvinceFlag(image: HTMLImageElement, code: string) {
  image.src = provinceFlags[code];
  image.dataset.province = code;
}
