/** Political lean of each state, used to color district pieces */
export enum PoliticalLean {
  StrongR = 0,
  LeanR = 1,
  TossUp = 2,
  LeanD = 3,
  StrongD = 4,
}

/** Map from 2-digit FIPS code to PoliticalLean */
export const stateLeans: Record<string, PoliticalLean> = {
  // StrongR
  '01': PoliticalLean.StrongR, // AL
  '02': PoliticalLean.StrongR, // AK
  '05': PoliticalLean.StrongR, // AR
  '12': PoliticalLean.StrongR, // FL
  '13': PoliticalLean.StrongR, // GA
  '16': PoliticalLean.StrongR, // ID
  '18': PoliticalLean.StrongR, // IN
  '20': PoliticalLean.StrongR, // KS
  '21': PoliticalLean.StrongR, // KY
  '22': PoliticalLean.StrongR, // LA
  '28': PoliticalLean.StrongR, // MS
  '29': PoliticalLean.StrongR, // MO
  '30': PoliticalLean.StrongR, // MT
  '31': PoliticalLean.StrongR, // NE
  '38': PoliticalLean.StrongR, // ND
  '39': PoliticalLean.StrongR, // OH
  '40': PoliticalLean.StrongR, // OK
  '45': PoliticalLean.StrongR, // SC
  '46': PoliticalLean.StrongR, // SD
  '47': PoliticalLean.StrongR, // TN
  '48': PoliticalLean.StrongR, // TX
  '49': PoliticalLean.StrongR, // UT
  '54': PoliticalLean.StrongR, // WV
  '56': PoliticalLean.StrongR, // WY

  // LeanR
  '19': PoliticalLean.LeanR, // IA
  '37': PoliticalLean.LeanR, // NC
  '33': PoliticalLean.LeanR, // NH

  // TossUp
  '04': PoliticalLean.TossUp, // AZ
  '26': PoliticalLean.TossUp, // MI
  '27': PoliticalLean.TossUp, // MN
  '32': PoliticalLean.TossUp, // NV
  '42': PoliticalLean.TossUp, // PA
  '51': PoliticalLean.TossUp, // VA
  '55': PoliticalLean.TossUp, // WI
  '60': PoliticalLean.TossUp, // AS
  '66': PoliticalLean.TossUp, // GU
  '69': PoliticalLean.TossUp, // MP
  '72': PoliticalLean.TossUp, // PR
  '78': PoliticalLean.TossUp, // VI

  // LeanD
  '08': PoliticalLean.LeanD, // CO
  '09': PoliticalLean.LeanD, // CT
  '10': PoliticalLean.LeanD, // DE
  '23': PoliticalLean.LeanD, // ME
  '34': PoliticalLean.LeanD, // NJ
  '35': PoliticalLean.LeanD, // NM
  '41': PoliticalLean.LeanD, // OR

  // StrongD
  '06': PoliticalLean.StrongD, // CA
  '11': PoliticalLean.StrongD, // DC
  '15': PoliticalLean.StrongD, // HI
  '17': PoliticalLean.StrongD, // IL
  '24': PoliticalLean.StrongD, // MD
  '25': PoliticalLean.StrongD, // MA
  '36': PoliticalLean.StrongD, // NY
  '44': PoliticalLean.StrongD, // RI
  '50': PoliticalLean.StrongD, // VT
  '53': PoliticalLean.StrongD, // WA
};
