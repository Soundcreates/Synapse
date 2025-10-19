// Example usage of AOS animations in your components

// 1. Basic fade-in animation
<div data-aos="fade-in">
  This content will fade in
</div>

// 2. Slide animations
<div data-aos="fade-up">
  This slides up from bottom
</div>

<div data-aos="fade-down">
  This slides down from top
</div>

<div data-aos="fade-left">
  This slides in from right
</div>

<div data-aos="fade-right">
  This slides in from left
</div>

// 3. Zoom animations
<div data-aos="zoom-in">
  This zooms in
</div>

<div data-aos="zoom-out">
  This zooms out
</div>

// 4. Flip animations
<div data-aos="flip-left">
  This flips from left
</div>

<div data-aos="flip-right">
  This flips from right
</div>

// 5. Custom duration and delay
<div 
  data-aos="fade-up" 
  data-aos-duration="1000"
  data-aos-delay="200"
>
  Custom timing
</div>

// 6. Animation offset (distance from trigger point)
<div 
  data-aos="fade-up" 
  data-aos-offset="200"
>
  Triggers 200px before element comes into view
</div>

// 7. Easing
<div 
  data-aos="fade-up" 
  data-aos-easing="ease-in-sine"
>
  Custom easing
</div>

// 8. Anchor placement
<div 
  data-aos="fade-up" 
  data-aos-anchor-placement="top-bottom"
>
  Different anchor placement
</div>

// Available easing options:
// linear, ease, ease-in, ease-out, ease-in-out, ease-in-back, ease-out-back, ease-in-out-back, ease-in-sine, ease-out-sine, ease-in-out-sine, ease-in-quad, ease-out-quad, ease-in-out-quad, ease-in-cubic, ease-out-cubic, ease-in-out-cubic, ease-in-quart, ease-out-quart, ease-in-out-quart

export { }