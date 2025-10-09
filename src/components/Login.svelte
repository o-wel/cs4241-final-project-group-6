<script>
  import { createEventDispatcher, onMount } from 'svelte'
  const dispatch = createEventDispatcher()

  let username = ''
  let password = ''
  let loading = false
  let error = ''
  let success = ''
  let usernameInput

  async function submit(e) {
    e?.preventDefault()
    if (loading) return // prevent double submit issues
    error = ''
    success = ''
    if (!username || !password) {
      error = 'Username and password are required'
      usernameInput?.focus()
      return
    }
    loading = true
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) {
        error = data?.message || 'Login failed'
        // focus on redoing username
        usernameInput?.focus()
      } else {
        // success
        dispatch('login', data)
        success = 'Signed in successfully'
        // hide success message after 1.5s
        setTimeout(() => success = '', 1500)
      }
    } catch (err) {
      error = 'Network error'
    } finally {
      loading = false
    }
  }
  onMount(() => usernameInput?.focus())
</script>

  <form onsubmit={submit} aria-live="polite" class="bg-gray-100 shadow-md rounded px-8 pt-6 pb-8 mb-4">
  <div class="mb-4">
    <label for="username">Username</label>
    <input id="username" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
           bind:this={usernameInput} bind:value={username} autocomplete="username" disabled={loading} placeholder="Username">
  </div>
  <div class="mb-4">
    <label for="password">Password</label>
    <input id="password" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="password"
           bind:value={password} autocomplete="current-password" disabled={loading} placeholder="Password">
  </div>
  {#if error}
    <div role="alert" style="color:crimson">{error}</div>
  {/if}
  {#if success}
    <div role="status" style="color:green">{success}</div>
  {/if}
  <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
</form>


