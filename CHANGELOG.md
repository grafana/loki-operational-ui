# Changelog

## 1.0.8

##### Chores

* **deps:**
  *  update dependency webpack to v5.104.1 [security] (#40) (7a2f6584)
  *  update dependency @types/node to v20.19.30 (#20) (90fd3a38)
  *  update dependency semver to v7.7.3 (#26) (f1603b46)
  *  update dependency @grafana/tsconfig to v2.0.1 (#19) (caa6ead2)
  *  update dependency @types/react to v18.3.27 (#21) (43f1fba2)
  *  update dependency @types/testing-library__jest-dom to v5.14.9 (#22) (b6aa2aa5)
  *  update dependency autoprefixer to v10.4.23 (#23) (f8e87ea3)
  *  update dependency eslint-plugin-react-refresh to v0.4.26 (#24) (232497e3)
  *  update dependency sass-loader to v13.3.3 (#25) (2f84b0b7)
  *  update dependency style-loader to v3.3.4 (#27) (c4975dd2)
  *  pin dependency glob to 10.5.0 (#18) (34bc5675)
  *  update dependency lodash to v4.17.23 [security] (#28) (d5dee7df)
  *  update dependency @radix-ui/react-slot to v1.2.4 (089574d5)
  *  update dependency glob to v10.5.0 [security] (356d9fdc)
  *  pin dependencies (ebee101e)
* **docs:**  add plugin catalogue docs (#39) (05961133)
* **dep:**  update grafana deps (861cf26c)

##### New Features

*  pass comparison status in query (#16) (fb6a4e2c)

##### Bug Fixes

* **deps:**  pin dependencies (101b4237)


## 1.0.7

##### Bug Fixes

*  use new analyze-labels endpoint (baef0231)


## 1.0.6

##### New Features

*  add stats bar and backend outcome filtering (9ebe9cd6)

##### Bug Fixes

*  a few more small fixes (4180719a)
*  remove unused properties (f51dc983)

##### Refactors

*  add abort controller pattern (cf68efa2)

##### Tests

*  fix tests and improve coverage (76e4f030)


## 1.0.5

##### Chores

*  PR feedback, add abort controller (6a228c8f)

##### New Features

* **goldfish:**  implement diff view for stored results (c943843a)

##### Tests

*  add more coverage and mock monaco (a7862c70)


## 1.0.4

##### Chores

*  add TODO (16a31ba6)
*  add more test cases (d2a0b03f)

##### Bug Fixes

*  url handling should be relative to grafana base url (7cf00593)

##### Tests

*  fix basename tests (6ba8cc48)


## 1.0.3

##### Chores

*  use an alert instead of card (845c94b6)

##### Bug Fixes

*  mock runtime config to fix test (d1e47294)
*  datasource uid refreshes the page (d67993ca)


## 1.0.2

##### Chores

* **ci:**  turn off playwright (3137a4b1)
*  fix the leading slash issue in absolutePath (94811f5e)
*  lint and fix, remove errors from tests (a5658ae5)
*  remove radix-ui/react-label, and cleanup from Loki API changes (c3e96af9)
* **logo:**
  *  remove publish-to-catalog-as-pending (8b5a9b48)
  *  use svg (75536e99)
* **tests:**
  *  fix tests (39a06e80)
  *  fix typecheck (94fe6119)
  *  fix tests (8fb0ccdf)
* **cd:**
  *  publish privately (c2c56e5f)
  *  publish publicly (529420dd)
  *  use false (002fdf2e)
  *  use string (6055cc0f)
  *  use true (46aeb468)
  *  use none (77ee70b3)
  *  use false (d242c7d2)
  *  use none (068055bc)
  *  contents write (e34ac71e)
  *  remove attestation (3493c6ad)

##### New Features

*  use the selected datasource uid in all api calls (6f11c637)

##### Other Changes

* grafana/loki-operational-ui (98834203)
* grafana/loki-operational-ui (f1d421aa)


## 1.0.1

## 1.0.0

Initial release.
