# Auto-Signup Implementation

**Status:** ✅ Implemented  
**Date:** 2025  
**Feature:** Automatic user creation during quiz submission with magic link authentication

---

## Overview

The auto-signup feature eliminates friction in the quiz-to-chat journey by:

1. **Automatically creating Supabase Auth users** when quiz is submitted
2. **Generating magic links** for passwordless authentication
3. **Redirecting authenticated** directly to Persona-AI chat (no manual login)
4. **Preventing duplicates** by checking if email already exists
5. **Saving user_id** with quiz_leads for proper linking

### Flow Diagram

```
┌─────────────────────┐
│  User fills Quiz    │
│  (src/quiz.js)      │
└──────────┬──────────┘
           │ POST /api/submit
           ▼
┌──────────────────────────────────┐
│  api/submit.js                   │
│  ┌────────────────────────────┐  │
│  │ 1. Verify user exists      │  │
│  │    admin.listUsers()       │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 2. Create if new           │  │
│  │    admin.createUser()      │  │
│  │    metadata: NOME, celular │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 3. Generate magic link     │  │
│  │    admin.generateLink()    │  │
│  │    redirectTo: callback    │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 4. Save quiz_leads         │  │
│  │    + user_id (if created)  │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 5. Return response         │  │
│  │    + redirect_url          │  │
│  │    + user_id               │  │
│  │    + is_new_user           │  │
│  └────────────────────────────┘  │
└──────────┬───────────────────────┘
           │ { redirect_url, user_id, ... }
           ▼
┌──────────────────────────────────┐
│  src/quiz.js                     │
│  ┌────────────────────────────┐  │
│  │ Wait 2 seconds             │  │
│  │ Check for token_hash       │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ Redirect with token        │  │
│  │ (magic link auth)          │  │
│  └────────────────────────────┘  │
└──────────┬───────────────────────┘
           │ window.location.href = redirect_url
           ▼
┌───────────────────────────────────┐
│ Persona-AI Auth Callback          │
│ /auth/callback?token_hash=X       │
│ &type=magiclink&next=/chat        │
├───────────────────────────────────┤
│ 1. Verify OTP (token_hash)        │
│ 2. Create session                 │
│ 3. Redirect to /chat authenticated│
└───────────────────────────────────┘
```

---

## Technical Details

### Backend: lib/supabase.js

The admin client is now exported with service role key for privileged operations:

```javascript
// lib/supabase.js
const supabaseAdmin = supabase.createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports.admin = supabaseAdmin;
```

**Usage:**
- `admin.auth.admin.listUsers()` - List all auth users (check for duplicates)
- `admin.auth.admin.createUser()` - Create new user with email
- `admin.auth.admin.generateLink()` - Generate magic link with callback

### Backend: api/submit.js

The quiz submission endpoint now includes 5-step auto-signup:

```javascript
// Step 1: Verify user exists
const { data: users, error: listError } = await admin.auth.admin.listUsers();
const existingUser = users?.find(u => u.email === email);

// Step 2: Create new user if doesn't exist
if (!existingUser) {
  const { data: newUser, error: createError } = 
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { NOME, celular }
    });
  userId = newUser?.id;
  isNewUser = true;
}

// Step 3: Generate magic link
if (userId) {
  const { data: link, error: linkError } = 
    await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      redirectTo: `${process.env.PERSONA_AI_URL}/auth/callback?next=/chat`
    });
  redirectUrl = link?.properties?.action_link;
}

// Step 4: Save quiz_leads with user_id
await supabase.from('quiz_leads').insert([{
  email,
  celular,
  respostas,
  user_id: userId, // Linked!
  ...
}]);

// Step 5: Return response with redirect_url
return { 
  user_id: userId, 
  is_new_user: isNewUser,
  redirect_url: redirectUrl,
  ...diagnostico
};
```

**Error Handling:**
- All admin operations wrapped in try-catch
- Non-blocking failures: Quiz still saves even if user creation fails
- Graceful degradation: Falls back to hardcoded URL if magic link generation fails

### Frontend: src/quiz.js

The `finalizarQuiz()` function now uses the authenticated redirect:

```javascript
// Wait 2 seconds and redirect already authenticated
setTimeout(() => {
  if (result.redirect_url && result.redirect_url.includes('token_hash')) {
    console.log('✅ Redirecting with authentication (magic link)');
    window.location.href = result.redirect_url; // With token
  } else {
    console.log('⚠️ Redirecting without authentication (fallback)');
    window.location.href = 'https://black.qigongbrasil.com/diagnostico';
  }
}, 2000);
```

---

## Database Schema Change

Run this SQL in Supabase SQL Editor to add the `user_id` column:

```sql
ALTER TABLE quiz_leads 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_leads_user_id ON quiz_leads(user_id);

COMMENT ON COLUMN quiz_leads.user_id IS 'Foreign key linking to Supabase Auth user (auto-created on quiz submission)';

-- Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quiz_leads' AND column_name = 'user_id';
```

---

## Environment Setup

Add/verify these variables in `.env.local`, `.env.test`, or `.env.production`:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ Backend only!

# Auto-signup redirect destination
PERSONA_AI_URL=https://persona-ai.vercel.app  # Default; override if needed
```

**⚠️ Security Warning:**
- `SUPABASE_SERVICE_ROLE_KEY` must **NEVER** be exposed in frontend
- `SUPABASE_KEY` (anon) is safe for frontend use
- `.env.local` and `.env.production` must be in `.gitignore`

---

## Testing

### Test Case 1: New User (Create & Redirect)

```bash
# 1. Submit quiz with new email
curl -X POST http://localhost:3001/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "celular": "11999999999",
    "respostas": {...}
  }'

# Expected:
# - response.user_id: UUID (newly created)
# - response.is_new_user: true
# - response.redirect_url: contains "token_hash"
# - quiz_leads: new row with user_id
# - auth.users: new user with email confirmed
```

### Test Case 2: Existing User (Reuse & Redirect)

```bash
# 1. Submit quiz with existing email (from Test Case 1)
curl -X POST http://localhost:3001/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "celular": "11999999999",
    "respostas": {...}
  }'

# Expected:
# - response.user_id: same UUID as Test Case 1
# - response.is_new_user: false
# - response.redirect_url: contains "token_hash"
# - quiz_leads: new row with same user_id
# - auth.users: no new user created
```

### Test Case 3: User Creation Failure (Still Save Quiz)

```bash
# 1. Temporarily remove SUPABASE_SERVICE_ROLE_KEY
# 2. Submit quiz
# 3. Expected:
#    - response.redirect_url: fallback URL
#    - quiz_leads: new row WITH NO user_id (null)
#    - Success: true (quiz still saved)
```

### Manual Testing in Browser

1. Go to http://localhost:3000 (quiz page)
2. Fill form with email: `test-auto-signup@example.com`
3. Submit quiz
4. Check browser console:
   ```
   ✅ QUIZ SALVO COM SUCESSO!
     User ID: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
     Novo usuário? true
     Redirect URL: https://persona-ai.vercel.app/auth/callback?token_hash=abc123...&type=magiclink&next=%2Fchat
   🔄 Redirecionando para: https://persona-ai.vercel.app/auth/callback?token_hash=...
   ✅ Redirecionando com autenticação (magic link)
   ```
5. Should redirect to Persona-AI already authenticated

---

## Troubleshooting

### Issue: `redirect_url` is null

**Cause:** Magic link generation failed  
**Solution:**
1. Verify `PERSONA_AI_URL` is set and correct
2. Check Supabase logs for admin.generateLink() errors
3. Verify email is not null or malformed

### Issue: User not created (is_new_user: false even for new email)

**Cause:** Service role key missing or invalid  
**Solution:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` in .env
2. Check Supabase dashboard: Settings > API > Service Role Key
3. Verify key has admin permissions

### Issue: Quiz saved but user_id is null

**Cause:** Likely non-blocking failure in user creation (expected behavior)  
**Solution:**
1. Check logs: Look for error messages around "Verify user exists" or "Create user"
2. May indicate service role key issue
3. Quiz still saved successfully (by design)

### Issue: "Cannot read property 'admin' of undefined"

**Cause:** lib/supabase.js not exporting admin client  
**Solution:**
1. Verify `module.exports.admin = supabaseAdmin;` exists in lib/supabase.js
2. Restart api server: `npm run api:test`

### Issue: Magic link email not received

**Cause:** Email confirmation disabled or delivery issue  
**Solution:**
1. Check Supabase Auth settings: Email confirmation enabled?
2. Check spam folder
3. Verify email address is correct in quiz form

---

## Rollback

If needed to revert auto-signup:

### Database (Remove user_id column)

```sql
ALTER TABLE quiz_leads DROP COLUMN user_id;
DROP INDEX IF EXISTS idx_quiz_leads_user_id;
```

### Code (Revert api/submit.js)

Restore original `POST /api/submit` handler without Steps 1-5 (user creation logic).

---

## Monitoring

### Key Metrics to Track

1. **User Creation Rate:** Count of `is_new_user: true` responses
2. **Magic Link Success Rate:** Count of `redirect_url` with token_hash present
3. **Auto-Signup Adoption:** Percentage of quiz submissions using magic link vs fallback
4. **User Linking Rate:** Percentage of quiz_leads with non-null `user_id`

### Logging Points

All steps in api/submit.js log to `whatsapp_logs` via logger:

```javascript
logger.log('AUTO_SIGNUP_STEP_1_VERIFY_USER', { email, found: !!existingUser });
logger.log('AUTO_SIGNUP_STEP_2_CREATE_USER', { email, userId: newUser?.id });
logger.log('AUTO_SIGNUP_STEP_3_MAGIC_LINK', { email, redirectUrl: link?.properties?.action_link });
logger.log('AUTO_SIGNUP_STEP_5_RESPONSE', { user_id: userId, is_new_user: isNewUser });
```

Check logs in Supabase:
```sql
SELECT * FROM whatsapp_logs 
WHERE message LIKE 'AUTO_SIGNUP%' 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## Next Steps

1. ✅ Execute SQL migration in Supabase SQL Editor
2. ✅ Test all 3 test cases above
3. ✅ Monitor magic link email delivery
4. ✅ Verify redirect to Persona-AI with authentication
5. Consider: Add analytics to track auto-signup adoption

---

## Files Modified

- `lib/supabase.js` - Added admin client export
- `api/submit.js` - Added 5-step auto-signup flow
- `src/quiz.js` - Updated finalizarQuiz() to use redirect_url
- `scripts/add-user-id-column.sql` - New migration script
- `.env.local` / `.env.test` / `.env.production` - Added PERSONA_AI_URL

## Related Documentation

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth/auth-magic-link)
- [Magic Link Flow](https://supabase.com/docs/reference/javascript/auth-signin-with-otp)
- [Quiz to Chat Journey](../readme-producao.md)
