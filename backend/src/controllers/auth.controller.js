import { getAuth } from "@clerk/express";

import { syncUserFromClerk } from "../lib/userSync.js";

export async function checkAuth(req,res,next){
    if(!req.user){
       return res.status(401).json({message: "Unauthorized"})
    }
    res.status(200).json(req.user)
}

// Called once by the client as soon as Clerk reports a signed-in session, so the
// profile exists before any other route needs it. Safe to call repeatedly: it upserts,
// which also refreshes a name or avatar the user changed in Clerk since last time.
export async function syncMe(req, res) {
    try {
        // Checked here rather than with Clerk's requireAuth(), which answers an
        // unauthenticated request with a 302 to the sign-in page. This is called by
        // XHR, so it needs a status the client can act on.
        const { userId } = getAuth(req)
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        const user = await syncUserFromClerk(userId)

        if (!user) {
            return res.status(422).json({ message: "Your Clerk account has no email address" })
        }

        res.status(200).json(user)
    } catch (error) {
        console.error("Error syncing user from Clerk:", error.message)
        res.status(502).json({ message: "Could not reach Clerk to sync your profile" })
    }
}
