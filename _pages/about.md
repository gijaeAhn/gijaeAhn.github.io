---
layout: about
title: about
permalink: /
subtitle: Robotics Engineer

profile:
  align: right
  image: me.jpg
  image_circular: false # crops the image to make it circular

selected_papers: false # includes a list of papers marked as "selected={true}"
social: true # includes social icons at the bottom of the page

announcements:
  enabled: false # includes a list of news items
  scrollable: true # adds a vertical scroll bar if there are more than 3 news items
  limit: 5 # leave blank to include all the news in the `_news` folder

latest_posts:
  enabled: false
  scrollable: true # adds a vertical scroll bar if there are more than 3 new posts items
  limit: 3 # leave blank to include all the blog posts
---

Hello! I'm **Gijae Ahn**.
I've focused on the situation and dynamics where robots make a contact with environment.
My work spans robot hardware design, control, motion planning, and integrated software pipelines for real-world tasks and competitions.

I completed my M.S. in Electrical and Electronic Engineering at Pusan National University under the supervision of **Prof. Seung-Joon Yi**.
<br>In my thesis, I explored **lightweight compliant manipulator design and dynamic non-prehensile object transfer**.

My research interests lie in **developing robust and effective robotic systems that assist people enhance their capabilities in everyday life**.
To pursue these interests, I have participated in multiple robotics competitions as part of my lab team, most notably RoboCup@Home, as well as industrial and space robotics challenges in Korea.

<!-- More recently, I have developed a strong interest in collaborative manipulation that leverages human intent estimation. -->

## **Competitions**

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/2025_robocup.gif" class="img-fluid rounded z-depth-1" alt="RoboCup@Home 2025" avoid_scaling=true %}
  </div>
  <div class="about-entry-body">
    <h3>RoboCup@Home 2025 (Salvador) <br>1st Place</h3>
    <p>
      At RoboCup@Home 2025, our team built the entire robot system in-house and demonstrated strong all-around performance. The robot featured two compliant manipulators that smoothly carried out manipulation tasks, with my contributions focused on arm design and control, motion planning, and integration with the robot’s task execution pipeline.
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/2024_robocup.gif" class="img-fluid rounded z-depth-1" alt="RoboCup@Home 2024" %}
  </div>
  <div class="about-entry-body">
    <h3>RoboCup@Home 2024 (Eindhoven) <br>2nd Place</h3>
    <p>
      Our team improved the robot’s hardware and overall system stability from the previous competition, while also deploying a local language model for complex natural-language-based task planning. I contributed by developing arm controllers, motion planning modules, and control API interfaces.
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/2023_robocup.gif" class="img-fluid rounded z-depth-1" alt="RoboCup@Home 2023" avoid_scaling=true %}
  </div>
  <div class="about-entry-body">
    <h3>RoboCup@Home 2023 (Bordeaux) <br>1st Place</h3>
    <p>
      As a lab intern, I contributed to robot hardware engineering and system integration. I also tested algorithms shared
      across two robot platforms, modified them to work reliably on both systems, and provided feedback for further
      improvement.
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/2024_zeus.jpg" class="img-fluid rounded z-depth-1" alt="ZEUS Industrial Robot ZERO Mission Challenge 2024" avoid_scaling=true cache_bust=true %}
  </div>
  <div class="about-entry-body">
    <h3>ZEUS ZERO Mission Challenge 2024 <br>1st Place (Presidential Award, Korea)</h3>
    <p>
      Developed an AI bartender robot that integrates LLM-based interaction with robotic manipulation for drink-serving tasks as a team leader. I implemented the arm controller, motion planning module, and LLM-based interaction pipeline, enabling the robot to understand user requests and execute corresponding bartender actions.
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/2023_mule.gif" class="img-fluid rounded z-depth-1" alt="Space Exploration and Development Robot Challenge 2023" avoid_scaling=true %}
  </div>
  <div class="about-entry-body">
    <h3>Space E&D Robot Challenge 2023 <br>1st Place (Prime Minister's Award, Korea)</h3>
    <p>
      We built and validated a custom rover for a lunar-environment mock mission, where it demonstrated stable mobility over harsh and uneven terrain. I developed the hardware and controller for the rover’s 4-DoF arm, enabling reliable remote operation and successful mineral collection.
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/2023_baemin_real.gif" class="img-fluid rounded z-depth-1" alt="Baemin Food Delivery Challenge 2023" %}
  </div>
  <div class="about-entry-body">
    <h3>Baemin Food Delivery Challenge 2023 <br>2nd Place (President's Award, KIRIA)</h3>
    <p>Our team built an autonomous delivery robot that uses IMU feedback to actively stabilize its top platform while navigating uneven terrain and real-world obstacles. I contributed by developing the low-level motor driver interface for the real-robot platform.</p>
  </div>
</div>

## **Publications**

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/throw_in_bucket.jpg" class="img-fluid rounded z-depth-1" alt="Dynamic Scoop-and-Flick Manipulation" %}
  </div>
  <div class="about-entry-body">
    <h3>Dynamic Scoop-and-Flick Manipulation for Rapid Non-Prehensile High-Arc Object Transfer</h3>
    <p><strong>ICRA 2026</strong><br><strong>G. Ahn</strong>*, J. Lee*, S. Oh, M. Shin, S.-J. Yi, and J. Seo</p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media about-entry-placeholder" aria-hidden="true"></div>
  <div class="about-entry-body">
    <h3>ANUBIS: A Compact, Low-Cost, Compliant Humanoid Mobile Manipulation Robot</h3>
    <p><strong>IEEE-RAS Humanoids 2025</strong><br>T. Kang, J. Kim, S. Nasrat, D. Song, <strong>G. Ahn</strong>, M. Jo, S. Lee, S.-J. Yi</p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media about-entry-placeholder" aria-hidden="true"></div>
  <div class="about-entry-body">
    <h3>Lucio at RoboCup@Home: An Open-Hardware Mobile Manipulator with Modular Software and On-Device LLM Planning</h3>
    <p>
      <strong>IEEE-RAS Humanoids 2025 (Poster Presentation)</strong><br>D. Song, T. Kang, S. Nasrat, J. Kim, M. Jo,
      <strong>G. Ahn</strong>, S. Lee, S. Yi
    </p>
  </div>
</div>

<div class="about-entry">
  <div class="about-entry-media about-entry-placeholder" aria-hidden="true"></div>
  <div class="about-entry-body">
    <h3>Development of Dual-Arm Human Companion Robots That Can Dance</h3>
    <p><strong>Sensors, 24(20), 6704</strong><br>J. Kim, T. Kang, D. Song, <strong>G. Ahn</strong>, S.-J. Yi</p>
  </div>
</div>

## Internship

<div class="about-entry">
  <div class="about-entry-media">
    {% include figure.liquid loading="eager" path="/assets/img/tommoro.jpg" class="img-fluid rounded z-depth-1" alt="Tomorro Robotics Korea internship" %}
  </div>
  <div class="about-entry-body">
    <h3>Tomorro Robotics Korea - Research Intern (Sep 2025 - Present)</h3>
    <p>
      Participated as an engineer in the development of an autonomous mobile manipulator for a dual-robot factory workflow
      demonstration at CES 2026.
    </p>
  </div>
</div>
