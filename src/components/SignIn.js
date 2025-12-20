import React, { useState } from "react";
import firebase from "firebase/compat/app";
import { auth } from "../firebase.js";
import { Box, Button, Typography, Paper, Stack } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

function SignIn() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  React.useEffect(() => {
    const fetchRedirectResult = async () => {
      try {
        await auth.getRedirectResult();
      } catch (err) {
        // ここでエラーが出てもユーザー操作を妨げないためログのみにする
        console.error("Google sign-in redirect error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRedirectResult();
  }, []);

  const signInWithGoogle = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMessage("");
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      // モバイルやWKWebViewではpopupがほぼ効かないため、最初からリダイレクトを使用
      await auth.signInWithRedirect(provider);
    } catch (err) {
      setErrorMessage("サインインに失敗しました。しばらくしてからもう一度お試しください。");
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(180deg, #b3e5fc 0%, #0288d1 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          maxWidth: 420,
          width: "100%",
          borderRadius: 4,
          p: 4,
          textAlign: "center",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.94) 100%)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "20px",
              background: "#e1f5fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 30px rgba(2,136,209,0.15)",
            }}
          >
            <img
              src={process.env.PUBLIC_URL + "/logo.png"}
              alt="Emorine"
              style={{ width: 48, height: 48, objectFit: "contain" }}
            />
          </Box>

          <Box>
            <Typography
              variant="h5"
              fontWeight="800"
              sx={{
                letterSpacing: "0.04em",
                color: "#01579b",
              }}
            >
              Emorine へようこそ
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              気持ちを海に流して、優しくシェアしましょう。
            </Typography>
          </Box>

          <Button
            onClick={signInWithGoogle}
            variant="contained"
            startIcon={<GoogleIcon />}
            fullWidth
            disabled={loading}
            sx={{
              py: 1.2,
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "1rem",
              background:
                "linear-gradient(90deg, #0288d1 0%, #26c6da 100%)",
              boxShadow: "0 8px 18px rgba(2,136,209,0.25)",
              "&:hover": { background: "linear-gradient(90deg, #0277bd 0%, #00acc1 100%)" },
            }}
          >
            {loading ? "サインイン中..." : "Googleでサインイン"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default SignIn;
