import {
  ready,
  verifySignatures,
  validateSingle,
  validateBatch,
  validateOOOBatch,
  validateMultiAuthorBatch,
} from "./index.js";

const msg1 = {
  key: "%/v5mCnV/kmnVtnF3zXtD4tbzoEQo4kRq/0d/bgxP1WI=.sha256",
  value: {
    previous: null,
    author: "@U5GvOKP/YUza9k53DSXxT0mk3PIrnyAmessvNfZl5E0=.ed25519",
    sequence: 1,
    timestamp: 1470186877575,
    hash: "sha256",
    content: {
      type: "about",
      about: "@U5GvOKP/YUza9k53DSXxT0mk3PIrnyAmessvNfZl5E0=.ed25519",
      name: "Piet",
    },
    signature:
      "QJKWui3oyK6r5dH13xHkEVFhfMZDTXfK2tW21nyfheFClSf69yYK77Itj1BGcOimZ16pj9u3tMArLUCGSscqCQ==.sig.ed25519",
  },
  timestamp: 1571140551481,
};

const msg2 = {
  key: "%kLWDux4wCG+OdQWAHnpBGzGlCehqMLfgLbzlKCvgesU=.sha256",
  value: {
    previous: "%/v5mCnV/kmnVtnF3zXtD4tbzoEQo4kRq/0d/bgxP1WI=.sha256",
    author: "@U5GvOKP/YUza9k53DSXxT0mk3PIrnyAmessvNfZl5E0=.ed25519",
    sequence: 2,
    timestamp: 1470187292812,
    hash: "sha256",
    content: {
      type: "about",
      about: "@U5GvOKP/YUza9k53DSXxT0mk3PIrnyAmessvNfZl5E0=.ed25519",
      image: {
        link: "&MxwsfZoq7X6oqnEX/TWIlAqd6S+jsUA6T1hqZYdl7RM=.sha256",
        size: 642763,
        type: "image/png",
        width: 512,
        height: 512,
      },
    },
    signature:
      "j3C7Us3JDnSUseF4ycRB0dTMs0xC6NAriAFtJWvx2uyz0K4zSj6XL8YA4BVqv+AHgo08+HxXGrpJlZ3ADwNnDw==.sig.ed25519",
  },
  timestamp: 1571140551485,
};

async function run() {
  await ready();

  let err = validateSingle(msg1);
  if (err) {
    console.log(err);
  } else {
    console.log("validateSingle works :)");
  }

  let err2 = validateBatch([msg1, msg2]);
  if (err2) {
    console.log(err2);
  } else {
    console.log("validateBatch works :)");
  }

  let err3 = validateOOOBatch([msg2, msg1]);
  if (err3) {
    console.log(err3);
  } else {
    console.log("validateOOOBatch works :)");
  }

  let err4 = validateMultiAuthorBatch([msg2, msg1]);
  if (err4) {
    console.log(err4);
  } else {
    console.log("validateMultiAuthorBatch works :)");
  }

  let err5 = verifySignatures([msg1, msg2]);
  if (err5) {
    console.log(err5);
  } else {
    console.log("verifySignatures works :)");
  }
}

run();
