# Bluehour Audio Infrastructure

Provisions a **private S3 bucket + CloudFront distribution** to serve Bluehour's
ambient audio files over a proper CDN instead of raw GitHub URLs.

Architecture:
```
Browser → CloudFront (HTTPS, edge-cached) → S3 (private, OAC-signed)
```

---

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/downloads) ≥ 1.0
- AWS CLI configured (`aws configure` or `~/.aws/credentials`)
- Your IAM user/role needs: S3 full access + CloudFront full access

---

## 1 — Deploy the infrastructure

```bash
cd infra/bluehour

# Download the AWS provider (~50 MB, one-time)
terraform init

# Preview what will be created (no changes made)
terraform plan

# Create the S3 bucket + CloudFront distribution (~2 min)
terraform apply
```

At the end of `apply`, Terraform prints three outputs:

```
cloudfront_domain          = "https://xxxxxxxxxxxx.cloudfront.net"
cloudfront_distribution_id = "EXXXXXXXXXXXX"
s3_bucket_name             = "bluehour-audio-231101980451"
```

**CloudFront takes 10–15 minutes to fully propagate** after creation.
You can still upload files immediately — they just won't be globally cached yet.

---

## 2 — Upload audio files

```bash
cd infra/bluehour
./upload-audio.sh
```

The script reads the bucket name directly from `terraform output`,
so no copy-pasting needed. It uploads everything in `public/audio/` with:
- `Content-Type: audio/mpeg`
- `Cache-Control: public, max-age=31536000, immutable`

To re-upload a single file manually:
```bash
aws s3 cp public/audio/loficafe.mp3 s3://bluehour-audio-231101980451/loficafe.mp3 \
  --content-type "audio/mpeg" \
  --cache-control "public, max-age=31536000, immutable"
```

---

## 3 — Set the env var in Vercel

1. Go to **Vercel Dashboard → bluehour → Settings → Environment Variables**
2. Add a new variable:
   - **Name:** `NEXT_PUBLIC_AUDIO_CDN`
   - **Value:** `https://xxxxxxxxxxxx.cloudfront.net` *(from terraform output)*
   - **Environments:** Production, Preview (not Development)
3. Redeploy the app (Settings → Deployments → Redeploy latest)

For local development, copy `.env.local.example` to `.env.local` and fill in the
CloudFront domain if you want to test against the real CDN locally.
Without the var, the app falls back to `public/audio/` automatically.

---

## 4 — Measure TTFB (for your resume)

After CloudFront has propagated (~15 min), run the included measurement script:

```bash
cd infra/bluehour
./measure-ttfb.sh
```

It hits 5 audio files, prints each TTFB, and reports the median.

---

## Teardown

To delete all AWS resources (bucket + CloudFront):

```bash
# First empty the bucket (Terraform can't delete a non-empty bucket)
aws s3 rm s3://bluehour-audio-231101980451 --recursive

cd infra/bluehour
terraform destroy
```

---

## Cost estimate

| Service    | Free tier                          | Expected usage        |
|------------|------------------------------------|-----------------------|
| S3 storage | 5 GB / month                       | ~138 MB               |
| S3 GETs    | 20,000 / month                     | Low (audio is cached) |
| CloudFront | 1 TB transfer + 10M requests / mo  | Very low              |

**Expected monthly cost: ~$0** on the AWS free tier.
