const functions = require('firebase-functions')
const admin = require('firebase-admin')

if (!admin.apps.length) admin.initializeApp()

const pad3 = (n) => String(n).padStart(3, '0')

/**
 * HTTP endpoint:
 * POST /generateFlats
 * body:
 *  - towerId: string (required)
 *  - wingId: string (required)
 *  - wingPrefix: string (required) e.g. "A"
 *  - floors: number (required) e.g. 12
 *  - flatsPerFloor: number (required) e.g. 3
 *
 * Optional:
 *  - startFloor?: number (default 1)
 *
 * Writes:
 *  towers/{towerId}/wings/{wingId}/flats/{flatId}
 */
exports.generateFlats = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' })
      return
    }

    const {
      towerId,
      wingId,
      wingPrefix,
      floors,
      flatsPerFloor,
      startFloor = 1,
    } = req.body || {}

    if (!towerId || !wingId || !wingPrefix) {
      res.status(400).json({ error: 'towerId, wingId, wingPrefix are required.' })
      return
    }

    const floorsNum = Number(floors)
    const fpfNum = Number(flatsPerFloor)
    const startFloorNum = Number(startFloor)

    if (!Number.isFinite(floorsNum) || floorsNum < 1) {
      res.status(400).json({ error: 'floors must be a number >= 1.' })
      return
    }
    if (!Number.isFinite(fpfNum) || fpfNum < 1) {
      res.status(400).json({ error: 'flatsPerFloor must be a number >= 1.' })
      return
    }
    if (!Number.isFinite(startFloorNum) || startFloorNum < 0) {
      res.status(400).json({ error: 'startFloor must be a number >= 0.' })
      return
    }

    // NOTE: For enterprise-grade security, prefer onCall + Firebase Auth.
    // This repo currently uses simple rules/flows; so we keep it minimal and rely on rules.
    // In the future, wrap with auth verification + admin role check.
    const wingRef = admin
      .firestore()
      .collection('towers')
      .doc(towerId)
      .collection('wings')
      .doc(wingId)

    let created = 0
    let skipped = 0

    for (let floorOffset = 0; floorOffset < floorsNum; floorOffset++) {
      const floor = startFloorNum + floorOffset // e.g. 1..floors

      for (let flatIndex = 1; flatIndex <= fpfNum; flatIndex++) {
        // Naming:
        // floor=1, flatIndex=1, wingPrefix=A => A-101
        // floor=12, flatIndex=3, wingPrefix=B => B-1203
        const flatNumber = `${wingPrefix}-${floor}${pad3(flatIndex).slice(-2).padStart(1, '0')}`
        // pad3(...).slice(-2) gives 01..99; for 1..9 => 01..09 => "1 digit" is ok for UX but stable.
        // If you want strict A-101/A-1203 style with fixed 2-digit flatIndex,
        // you can replace flatNumber generation with `${wingPrefix}-${floor}${pad3(flatIndex).slice(-3).padStart(3,'0')}` etc.

        const flatId = `${wingPrefix}-${floor}-${pad3(flatIndex)}`
        const flatRef = wingRef.collection('flats').doc(flatId)

        const snap = await flatRef.get()
        if (snap.exists) {
          skipped++
          continue
        }

        await flatRef.set({
          flatId,
          towerId,
          wingId,
          wingPrefix,
          floor,
          flatIndex,
          flatNumber: flatNumber.replace(/\s+/g, ''),
          status: 'vacant', // occupied | vacant | rented | maintenance
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        created++
      }
    }

    res.status(200).json({ ok: true, created, skipped })
  } catch (err) {
    console.error('[generateFlats]', err)
    res.status(500).json({ error: err?.message || 'Internal error' })
  }
})
