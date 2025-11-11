[**fraktal-lib v1.0.0**](../README.md)

***

[fraktal-lib](../README.md) / StoreObject

# Type Alias: StoreObject

> **StoreObject** = `object`

Defined in: [src/lib/services/package/types.common.ts:147](https://github.com/Fraktal-PM3/fraktal-lib/blob/ef9f81b4b37e0abcd4aa9aaaf462d8ccabda1c46/src/lib/services/package/types.common.ts#L147)

Opaque object used to store private package data with integrity.
Typically sent through transient/private channels.

## Properties

### packageDetails

> **packageDetails**: [`PackageDetails`](PackageDetails.md)

Defined in: [src/lib/services/package/types.common.ts:156](https://github.com/Fraktal-PM3/fraktal-lib/blob/ef9f81b4b37e0abcd4aa9aaaf462d8ccabda1c46/src/lib/services/package/types.common.ts#L156)

Public package details mirrored in private context for verification.

***

### pii

> **pii**: [`PackagePII`](PackagePII.md)

Defined in: [src/lib/services/package/types.common.ts:154](https://github.com/Fraktal-PM3/fraktal-lib/blob/ef9f81b4b37e0abcd4aa9aaaf462d8ccabda1c46/src/lib/services/package/types.common.ts#L154)

Private, personally identifiable information.

***

### salt

> **salt**: `string`

Defined in: [src/lib/services/package/types.common.ts:152](https://github.com/Fraktal-PM3/fraktal-lib/blob/ef9f81b4b37e0abcd4aa9aaaf462d8ccabda1c46/src/lib/services/package/types.common.ts#L152)

Salt used when hashing [PackageDetails](PackageDetails.md) and [PackagePII](PackagePII.md)
for integrity verification.
